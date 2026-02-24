// Always load env from server/.env regardless of where the process is started from.
// (Existing process.env values from the host are not overridden by default.)
require('dotenv').config({ path: __dirname + '/.env' })
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { MongoClient, ObjectId } = require('mongodb')
let StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest, RefundRequest
try {
  const pgSdk = require('pg-sdk-node')
  StandardCheckoutClient = pgSdk.StandardCheckoutClient
  Env = pgSdk.Env
  MetaInfo = pgSdk.MetaInfo
  StandardCheckoutPayRequest = pgSdk.StandardCheckoutPayRequest
  RefundRequest = pgSdk.RefundRequest
} catch (err) {
  console.warn('[phonepe] SDK import failed:', err?.message || err)
}


const app = express()
const PORT = process.env.PORT || 5000

// Local uploads (simple disk storage for dev / small deployments)
const UPLOADS_DIR = path.join(__dirname, 'uploads')
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
} catch { /* ignore */ }

// Serve uploaded files publicly
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', etag: true }))

// Serve frontend static files (built by Vite)
const FRONTEND_DIST = path.join(__dirname, '../my-app/dist')
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST, { maxAge: '1h', etag: true }))
}

// CORS: allow local dev and any origins listed in ALLOWED_ORIGINS (comma-separated)
const defaultAllowed = ['https://www.khushiyan.store', 'https://khushiyan.store']
const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const allowedList = Array.from(new Set([...defaultAllowed, ...allowedFromEnv]))
const allowAll = allowedFromEnv.includes('*')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok =
      allowAll ||
      allowedList.includes(origin) ||
      origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') ||
      origin.startsWith('http://127.0.0.1:') || origin.startsWith('https://127.0.0.1:')
    cb(null, !!ok)
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204,
  credentials: false
}))
// Preflight is handled by the cors() middleware above


// PhonePe webhook: must capture raw body string BEFORE express.json() middleware
try {
  app.post('/api/webhooks/phonepe', express.text({ type: '*/*', limit: '1mb' }), (req, res) => {
    try {
      const client = getPhonePeClient()
      const auth = req.get('authorization') || ''
      const username = process.env.PHONEPE_WEBHOOK_USER || ''
      const password = process.env.PHONEPE_WEBHOOK_PASS || ''
      const cb = client.validateCallback(
        username,
        password,
        auth,
        req.body || ''
      )
      // TODO: persist event (cb.type, cb.payload) and update order/refund status as needed
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/webhooks/phonepe error', err)
      res.status(400).json({ error: 'invalid_callback' })
    }
  })
  console.log('[routes] /api/webhooks/phonepe registered')
} catch (err) {
  console.error('[routes] Failed to register /api/webhooks/phonepe:', err.message)
}

// Admin: upload product images (JSON data URLs -> saved file -> returned URL)
// Note: this route is defined BEFORE the global express.json() so we can use a higher body limit.
try {
  app.post('/api/uploads/images', express.json({ limit: '25mb' }), async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return

      const body = req.body || {}
      const files = Array.isArray(body.files) ? body.files : []
      if (!files.length) return res.status(400).json({ error: 'no_files' })

      const maxFiles = 10
      const maxBytes = 2_000_000 // ~2MB per image (after base64 decode)
      const allowExtByMime = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`
      const outUrls = []

      for (const f of files.slice(0, maxFiles)) {
        const dataUrl = String(f?.dataUrl || '')
        if (!dataUrl.startsWith('data:image/')) continue

        const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/)
        if (!m) continue
        const mime = String(m[1] || '').toLowerCase()
        const ext = allowExtByMime[mime]
        if (!ext) continue

        const b64 = m[2] || ''
        let buf
        try {
          buf = Buffer.from(b64, 'base64')
        } catch {
          continue
        }
        if (!buf?.length || buf.length > maxBytes) continue

        const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${ext}`
        const full = path.join(UPLOADS_DIR, filename)
        await fs.promises.writeFile(full, buf)
        outUrls.push(`${baseUrl}/uploads/${filename}`)
      }

      if (!outUrls.length) return res.status(400).json({ error: 'no_valid_images' })
      res.json({ ok: true, urls: outUrls })
    } catch (err) {
      console.error('POST /api/uploads/images error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/uploads/images registered')
} catch (err) {
  console.error('[routes] Failed to register /api/uploads/images:', err.message)
}

app.use(express.json({ limit: '5mb' }))

// Cloudinary: signed upload support (frontend uploads directly to Cloudinary CDN)
// The API secret never leaves the server; client asks for a signature + timestamp.
function cloudinarySign(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')
}

// Admin-only: return signature for uploading product images to Cloudinary.
// Frontend will POST the file directly to:
//   https://api.cloudinary.com/v1_1/<cloudName>/image/upload
try {
  app.post('/api/cloudinary/sign', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'cloudinary_not_configured' })
      }

      const folder = 'dship/products'
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = cloudinarySign({ folder, timestamp }, apiSecret)

      res.json({ ok: true, cloudName, apiKey, folder, timestamp, signature })
    } catch (err) {
      console.error('POST /api/cloudinary/sign error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/cloudinary/sign registered')
} catch (err) {
  console.error('[routes] Failed to register /api/cloudinary/sign:', err.message)
}

// Lightweight ping to keep server warm and for client health-check
try {
  app.get('/api/ping', (req, res) => res.json({ ok: true, t: Date.now() }))
  console.log('[routes] /api/ping registered')
} catch (err) {
  console.error('[routes] Failed to register /api/ping:', err.message)
}


let client
let db

async function getDb() {
  if (db) return db
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGODB_URI')
  client = new MongoClient(uri, {
    // Faster and more resilient connection settings
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    maxPoolSize: 20,
    minPoolSize: 1,
  })
  await client.connect()
  db = client.db('dship')
  return db
}
// ----- PhonePe (Standard Checkout) -----
let phonePeClient = null
function getPhonePeClient() {
  if (phonePeClient) return phonePeClient
  const { PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, PHONEPE_ENV } = process.env
  const id = String(PHONEPE_CLIENT_ID || '').trim().replace(/^['"]|['"]$/g, '')
  const secret = String(PHONEPE_CLIENT_SECRET || '').trim().replace(/^['"]|['"]$/g, '')
  const version = Number((PHONEPE_CLIENT_VERSION ?? 1)) || 1
  if (!id || !secret) {
    throw new Error('PhonePe not configured (set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET)')
  }
  const env = String(PHONEPE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX
  phonePeClient = StandardCheckoutClient.getInstance(
    id,
    secret,
    version,
    env
  )
  return phonePeClient
}

// Create a checkout session and get redirect URL
try {
  app.post('/api/payments/phonepe/checkout', async (req, res) => {
    try {
      const client = getPhonePeClient()
      const amount = Math.max(100, Number(req.body?.amount || 0) | 0) // amount in paisa
      const redirectUrl = String(
        req.body?.redirectUrl || process.env.PHONEPE_REDIRECT_URL || 'http://localhost:5173/payment/phonepe/return'
      )
      const merchantOrderId = (require('crypto').randomUUID?.() || require('crypto').randomBytes(16).toString('hex'))

      const metaBuilder = MetaInfo?.builder ? MetaInfo.builder().udf1('web') : null
      let builder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amount)
        .redirectUrl(redirectUrl)
      if (metaBuilder) builder = builder.metaInfo(metaBuilder.build())

      const request = builder.build()
      const response = await client.pay(request)

      res.json({
        merchantOrderId,
        state: response?.state,
        redirectUrl: response?.redirectUrl,
        orderId: response?.orderId,
        expireAt: response?.expireAt
      })
    } catch (err) {
      const details = { code: err?.code || err?.httpStatusCode, httpStatusCode: err?.httpStatusCode, data: err?.data }
      console.error('POST /api/payments/phonepe/checkout error', { message: err?.message, ...details })
      res.status(500).json({ error: 'phonepe_checkout_failed', message: err?.message || 'Error', ...details })
    }
  })
  console.log('[routes] /api/payments/phonepe/checkout registered')
} catch (err) {
  console.error('[routes] Failed to register /api/payments/phonepe/checkout:', err.message)
}

// Check order status
try {
  app.get('/api/payments/phonepe/status', async (req, res) => {
    try {
      const client = getPhonePeClient()
      const merchantOrderId = String(req.query?.merchantOrderId || '')
      if (!merchantOrderId) return res.status(400).json({ error: 'merchantOrderId required' })
      const response = await client.getOrderStatus(merchantOrderId)
      res.json(response)
    } catch (err) {
      const details = { code: err?.code || err?.httpStatusCode, httpStatusCode: err?.httpStatusCode, data: err?.data }
      console.error('GET /api/payments/phonepe/status error', { message: err?.message, ...details })
      res.status(500).json({ error: 'phonepe_status_failed', message: err?.message || 'Error', ...details })
    }
  })
  console.log('[routes] /api/payments/phonepe/status registered')
} catch (err) {
  console.error('[routes] Failed to register /api/payments/phonepe/status:', err.message)
}

// Initiate refund
try {
  app.post('/api/payments/phonepe/refund', async (req, res) => {
    try {
      const client = getPhonePeClient()
      const originalMerchantOrderId = String(req.body?.originalMerchantOrderId || '')
      const amount = Math.max(1, Number(req.body?.amount || 0) | 0)
      const merchantRefundId = String(
        req.body?.merchantRefundId || (require('crypto').randomUUID?.() || require('crypto').randomBytes(16).toString('hex'))
      )
      if (!originalMerchantOrderId) return res.status(400).json({ error: 'originalMerchantOrderId required' })

      const request = RefundRequest.builder()
        .amount(amount)
        .merchantRefundId(merchantRefundId)
        .originalMerchantOrderId(originalMerchantOrderId)
        .build()

      const response = await client.refund(request)
      res.json(response)
    } catch (err) {
      const details = { code: err?.code || err?.httpStatusCode, httpStatusCode: err?.httpStatusCode, data: err?.data }
      console.error('POST /api/payments/phonepe/refund error', { message: err?.message, ...details })
      res.status(500).json({ error: 'phonepe_refund_failed', message: err?.message || 'Error', ...details })
    }
  })
  console.log('[routes] /api/payments/phonepe/refund registered')
} catch (err) {
  console.error('[routes] Failed to register /api/payments/phonepe/refund:', err.message)
}



// ----- Email (optional) -----
// Configure via .env: SMTP_HOST, SMTP_PORT=587, SMTP_USER, SMTP_PASS, FROM_EMAIL, STORE_NAME
function getMailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  try {
    const nodemailer = require('nodemailer')
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  } catch (e) {
    console.warn('[mail] nodemailer not installed; skipping emails')
    return null
  }
}

async function sendOrderPlacedEmail({ to, orderId, customer, items, totals }) {
  const transporter = getMailer()
  if (!transporter) return false
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER
  const store = process.env.STORE_NAME || 'KhushiyanaStore'

  const list = (items || []).slice(0, 10).map(i => `<li>${(i.title||'Item')} × ${i.quantity} — ₹${i.unitPrice}</li>`).join('')
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 12px">${store}: Order Placed ✅</h2>
      <p>Hi ${customer?.name || ''},</p>
      <p>Thanks for shopping with us. Your order <b>#${orderId}</b> has been placed successfully.</p>
      <ul>${list}</ul>
      <p><b>Total:</b> ₹${totals?.total ?? ''}</p>
      <p>We will contact you soon with shipping details.</p>
      <p style="color:#6b7280;font-size:12px;">If you did not place this order, reply to this email.</p>
    </div>`
  const text = `Hi ${customer?.name || ''},\nYour order #${orderId} has been placed. Total: ₹${totals?.total ?? ''}.\nThank you for shopping with ${store}.`

  try {
    await transporter.sendMail({ from, to, subject: `${store}: Your order has been placed (#${orderId})`, html, text })
    return true
  } catch (err) {
    console.error('[mail] send failed', err)
    return false
  }
}

// Notify store owner when an order is received
async function sendOrderReceivedEmailToOwner({ to, orderId, customer, items, totals }) {
  const transporter = getMailer()
  if (!transporter) return false
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER
  const store = process.env.STORE_NAME || 'KhushiyanaStore'
  const list = (items || []).slice(0, 10).map(i => `<li>${(i.title||'Item')} × ${i.quantity} — ₹${i.unitPrice}</li>`).join('')
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 12px">${store}: New order received</h2>
      <p><b>Order:</b> #${orderId}</p>
      <p><b>Customer:</b> ${customer?.name || ''} &lt;${customer?.email || ''}&gt; ${customer?.phone ? '('+customer.phone+')' : ''}</p>
      <ul>${list}</ul>
      <p><b>Total:</b> ₹${totals?.total ?? ''}</p>
    </div>`
  const text = `New order #${orderId}\nCustomer: ${customer?.name || ''} <${customer?.email || ''}>\nTotal: ₹${totals?.total ?? ''}`
  try {
    await transporter.sendMail({ from, to, subject: `${store}: New order received (#${orderId})`, html, text })
    return true
  } catch (err) {
    console.error('[mail] owner notify failed', err)
    return false
  }
}


// Send OTP email (polished, professional template)
async function sendOtpEmail({ to, code }) {
  const transporter = getMailer()
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER
  const store = process.env.STORE_NAME || 'KhushiyanaStore'
  const brand = '#FF3F6C'
  const html = `
    <div style="background:#f7f7fb;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
        <div style="background:${brand};color:#fff;padding:14px 18px;font-weight:800;font-size:18px;letter-spacing:.2px">${store}</div>
        <div style="padding:20px 18px">
          <h2 style="margin:0 0 8px;font-size:20px">Verify your login</h2>
          <p style="margin:0 0 14px;color:#374151">Use the One‑Time Password (OTP) below to continue. This code is valid for the next 5 minutes.</p>
          <div style="display:inline-block;font-size:30px;letter-spacing:8px;font-weight:900;background:#f8fafc;border:1px dashed #d1d5db;padding:12px 16px;border-radius:12px;color:#111827">${code}</div>
          <p style="margin:16px 0 0;color:#6b7280;font-size:12px">Do not share this code with anyone. If you didn’t request it, you can safely ignore this email.</p>
        </div>
        <div style="padding:12px 18px;background:#fafafa;color:#6b7280;font-size:12px">Need help? Reply to this email and our team will assist you.</div>
      </div>
    </div>`
  const text = `Your ${store} OTP is ${code}. It expires in 5 minutes. Do not share this code with anyone.`
  try {
    if (!transporter) {
      console.warn('[mail] transporter not configured. OTP code for', to, ':', code)
      return false
    }
    console.log(`[mail] Sending OTP email to ${to}...`)
    await transporter.sendMail({ from, to, subject: `${store} — Your OTP to Sign In`, html, text })
    console.log(`[mail] OTP email sent successfully to ${to}`)
    return true
  } catch (err) {
    console.error('[mail] otp send failed for', to, ':', err?.message || err)
    return false
  }
}


// OTP storage using MongoDB with TTL index
let otpIndexReady = false
async function getOtpCollection() {
  const database = await getDb()
  const coll = database.collection('otps')
  if (!otpIndexReady) {
    try {
      await coll.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      await coll.createIndex({ email: 1 }, { background: true })
    } catch (e) {
      console.warn('[otp] index creation failed', e?.message || e)
    }
    otpIndexReady = true
  }
  return coll
}
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Send OTP to email (store code in MongoDB with TTL)
// Allow any valid email to request OTP (customers + admin)
try {
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase()

      if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' })

	      // IMPORTANT: make OTP issuance idempotent during the TTL window.
	      // The client may retry (e.g. due to timeout / cold start). If we generate a new
	      // code on every request, users can receive OTP#1 in email while OTP#2 is stored,
	      // causing "Invalid or expired code" even when they enter the received OTP.
	      const coll = await getOtpCollection()
	      const now = new Date()
	      const existing = await coll.findOne({ email, expiresAt: { $gt: now } })
	      let code
	      let expiresAt
	      if (existing?.code && existing?.expiresAt) {
	        code = String(existing.code)
	        expiresAt = existing.expiresAt
	        console.log(`[otp] Reusing OTP for ${email}: ${code}`)
	      } else {
	        code = generateOtp()
	        expiresAt = new Date(Date.now() + 5 * 60 * 1000)
	        await coll.updateOne(
	          { email },
	          { $set: { email, code, expiresAt, createdAt: now } },
	          { upsert: true }
	        )
	        console.log(`[otp] Generated OTP for ${email}: ${code}`)
	      }

      // send OTP email in background (do not block response to avoid client timeouts)
      sendOtpEmail({ to: email, code }).then(sent => {
        if (sent) {
          console.log(`[otp] Email sent successfully to ${email}`)
        } else {
          console.warn(`[otp] Email send failed for ${email}, but OTP is stored in DB`)
        }
      }).catch(err => {
        console.error(`[otp] Email send error for ${email}:`, err)
      })

      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/auth/request-otp error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/auth/request-otp registered')
} catch (err) {
  console.error('[routes] Failed to register /api/auth/request-otp:', err.message)
}

// Verify OTP and return a short-lived token (unsigned demo token)
try {
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase()
	      const code = String(req.body?.code || '').trim().replace(/[^0-9]/g, '')
	      if (!code) return res.status(400).json({ error: 'OTP code required' })
      const coll = await getOtpCollection()
      const rec = await coll.findOne({ email, code, expiresAt: { $gt: new Date() } })
      if (!rec) return res.status(400).json({ error: 'Invalid or expired code' })
      await coll.deleteOne({ _id: rec._id })
      // very simple token for demo: base64(email|ts)
      const token = Buffer.from(`${email}|${Date.now()}`).toString('base64')
      res.json({ token, email })
    } catch (err) {
      console.error('POST /api/auth/verify-otp error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/auth/verify-otp registered')
} catch (err) {
  console.error('[routes] Failed to register /api/auth/verify-otp:', err.message)
}

// Admin login with email and password
try {
  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase()
      const password = String(req.body?.password || '').trim()
      const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
      const adminPassword = process.env.ADMIN_PASSWORD || 'Qstn5ufy33@dship'

      if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
      if (email !== adminEmail) return res.status(403).json({ error: 'Invalid credentials' })
      if (password !== adminPassword) return res.status(403).json({ error: 'Invalid credentials' })

      // Generate token: base64(email|ts)
      const token = Buffer.from(`${email}|${Date.now()}`).toString('base64')
      console.log(`[auth] Admin login successful for ${email}`)
      res.json({ token, email })
    } catch (err) {
      console.error('POST /api/auth/login error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/auth/login registered')
} catch (err) {
  console.error('[routes] Failed to register /api/auth/login:', err.message)
}

function parseDemoToken(authHeader) {
  const raw = (authHeader || '').replace(/^Bearer\s+/i, '')
  try { return Buffer.from(raw, 'base64').toString('utf8').split('|')[0] } catch { return null }
}

function requireAdmin(req, res) {
  const email = parseDemoToken(req.headers.authorization)
  const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
  if (!email || email !== adminEmail) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }
  return email
}

// Unified orders endpoint: if email is admin, return all; else return own (+hasReturn)
try {
  app.get('/api/orders/me', async (req, res) => {
    try {
      const email = parseDemoToken(req.headers.authorization)
      if (!email) return res.status(401).json({ error: 'Unauthorized' })
      const database = await getDb()

      const isAdmin = email === (process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com')
      const q = isAdmin ? {} : { 'customer.email': email }

      const docs = await database.collection('orders').find(q).sort({ createdAt: -1 }).limit(1000).toArray()

      // For customers, mark orders that already have a return request
      let returnedSet = new Set()
      if (!isAdmin) {
        const rets = await database.collection('returns').find({ email }).project({ orderId: 1 }).toArray()
        returnedSet = new Set(rets.map(r => String(r.orderId)))
      }

      const out = docs.map(d => ({
        id: String(d._id), createdAt: d.createdAt, status: d.status,
        customer: d.customer, address: d.address, paymentMethod: d.paymentMethod,
        totals: d.totals, total: d.totals?.total, items: d.items || [],
        itemsCount: (d.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0),
        hasReturn: !isAdmin && returnedSet.has(String(d._id)),
      }))
      res.json({ email, isAdmin, orders: out })
    } catch (err) {
      console.error('GET /api/orders/me error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/orders/me registered')
} catch (err) {
  console.error('[routes] Failed to register /api/orders/me:', err.message)
}

try {
  app.get('/api/debug/email', (req, res) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_SECURE } = process.env
    const hasMailer = !!getMailer()
    res.json({
      configured: hasMailer,
      host: SMTP_HOST || null,
      port: SMTP_PORT || null,
      user: SMTP_USER || null,
      secure: SMTP_SECURE || null,
      hasPassword: !!process.env.SMTP_PASS,
      adminEmail: process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
    })
  })
  console.log('[routes] /api/debug/email registered')
} catch (err) {
  console.error('[routes] Failed to register /api/debug/email:', err.message)
}

try {
  app.get('/api/debug/phonepe', (req, res) => {
    const { PHONEPE_CLIENT_ID, PHONEPE_CLIENT_VERSION, PHONEPE_ENV, PHONEPE_REDIRECT_URL } = process.env
    res.json({
      env: PHONEPE_ENV || null,
      version: Number(PHONEPE_CLIENT_VERSION || '0') || 0,
      clientIdTail: (PHONEPE_CLIENT_ID || '').slice(-6),
      hasClientId: !!PHONEPE_CLIENT_ID,
      hasSecret: !!process.env.PHONEPE_CLIENT_SECRET,
      redirectUrl: PHONEPE_REDIRECT_URL || null
    })
  })
  console.log('[routes] /api/debug/phonepe registered')
} catch (err) {
  console.error('[routes] Failed to register /api/debug/phonepe:', err.message)
}

try {
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, now: new Date().toISOString() })
  })
  console.log('[routes] /api/health registered')
} catch (err) {
  console.error('[routes] Failed to register /api/health:', err.message)
}

// Friendly root route so hitting http://localhost:5000/ doesn't show "Cannot GET /"
try {
  app.get('/', (req, res) => {
    res.type('text/plain').send('DShip backend is running. Try: GET /api/health, GET /api/products, POST /api/orders')
  })
  console.log('[routes] / registered')
} catch (err) {
  console.error('[routes] Failed to register /:', err.message)
}




// Submit return request – persist in DB, email store owner, and send confirmation to customer
try {
  app.post('/api/returns', async (req, res) => {
    try {
      const body = req.body || {}
      const orderId = String(body.orderId || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const reasons = Array.isArray(body.reasons) ? body.reasons.slice(0, 10) : []
      const custom = String(body.customReason || '').trim()
      const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []

      if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' })

      // Upsert return in DB (idempotent per orderId+email)
      const database = await getDb()
      await database.collection('returns').updateOne(
        { orderId, email },
        { $setOnInsert: { orderId, email, reasons, customReason: custom, images, status: 'open', createdAt: new Date() } },
        { upsert: true }
      )

      const transporter = getMailer()
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER
      const store = process.env.STORE_NAME || 'KhushiyanaStore'
      const owner = process.env.RETURNS_EMAIL || process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'

      const reasonList = reasons.map(r=>`<li>${r}</li>`).join('')

      // Convert data URLs to inline attachments with CIDs so email clients (Gmail) display them
      const attachments = []
      const cidImgs = []
      for (let i = 0; i < images.length; i++) {
        const src = String(images[i] || '')
        const m = src.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/)
        if (!m) continue
        const mime = m[1]
        const b64 = m[2]
        const ext = (mime.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi,'')
        const cid = `return-photo-${Date.now()}-${i}`
        attachments.push({ filename: `photo-${i+1}.${ext}`, content: Buffer.from(b64, 'base64'), contentType: mime, cid })
        cidImgs.push(`<img src=\"cid:${cid}\" alt=\"photo\" style=\"max-width:420px; display:block; margin:6px 0; border-radius:8px; border:1px solid #e5e7eb\"/>`)
      }

      const ownerHtml = `
        <div style=\"font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6\">
          <h2 style=\"margin:0 0 8px\">${store}: New Return Request</h2>
          <p><b>Order:</b> #${orderId}</p>
          <p><b>Customer:</b> ${email}</p>
          ${reasons.length ? `<div><b>Reasons:</b><ul>${reasonList}</ul></div>` : ''}
          ${custom ? `<div><b>Details:</b><div>${custom}</div></div>` : ''}
          ${cidImgs.join('')}
        </div>`
      const ownerText = `Return request\nOrder: #${orderId}\nCustomer: ${email}\nReasons: ${reasons.join(', ')}\nDetails: ${custom}`

      if (!transporter) {
        console.warn('[mail] transporter not configured. Return request saved to DB:', { orderId, email })
        return res.json({ ok: true })
      }

      await transporter.sendMail({ from, to: owner, subject: `${store}: Return request (#${orderId})`, html: ownerHtml, text: ownerText, attachments })
      await transporter.sendMail({ from, to: email, subject: `${store}: Return request received (#${orderId})`, html: `<p>We have received your return request for order <b>#${orderId}</b>. Our team will review and contact you soon.</p>`, text: `We have received your return request for order #${orderId}.` })

      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/returns error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/returns registered')
} catch (err) {
  console.error('[routes] Failed to register /api/returns:', err.message)
}

// Admin: list all return requests
try {
  app.get('/api/returns/admin', async (req, res) => {
    try {
      const email = parseDemoToken(req.headers.authorization)
      const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
      if (!email || email !== adminEmail) return res.status(403).json({ error: 'Forbidden' })

      const database = await getDb()
      const docs = await database.collection('returns').find({}).sort({ createdAt: -1 }).limit(1000).toArray()
      const out = docs.map(d => ({
        id: String(d._id),
        orderId: String(d.orderId),
        email: d.email,
        reasons: d.reasons || [],
        customReason: d.customReason || '',
        images: Array.isArray(d.images) ? d.images.slice(0, 3) : [],
        status: d.status || 'open',
        createdAt: d.createdAt,
      }))
      res.json({ returns: out })
    } catch (err) {
      console.error('GET /api/returns/admin error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/returns/admin registered')
} catch (err) {
  console.error('[routes] Failed to register /api/returns/admin:', err.message)
}

// Admin: mark a return as resolved
try {
  app.post('/api/returns/:id/resolve', async (req, res) => {
    try {
      const email = parseDemoToken(req.headers.authorization)
      const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
      if (!email || email !== adminEmail) return res.status(403).json({ error: 'Forbidden' })

      const database = await getDb()
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ error: 'missing_id' })
      await database.collection('returns').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'resolved', resolvedAt: new Date() } })
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/returns/:id/resolve error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/returns/:id/resolve registered')
} catch (err) {
  console.error('[routes] Failed to register /api/returns/:id/resolve:', err.message)
}

// Admin: reopen a resolved return
try {
  app.post('/api/returns/:id/reopen', async (req, res) => {
    try {
      const email = parseDemoToken(req.headers.authorization)
      const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
      if (!email || email !== adminEmail) return res.status(403).json({ error: 'Forbidden' })

      const database = await getDb()
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ error: 'missing_id' })
      await database.collection('returns').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'open' }, $unset: { resolvedAt: '' } })
      res.json({ ok: true })
    } catch (err) {
      console.error('POST /api/returns/:id/reopen error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/returns/:id/reopen registered')
} catch (err) {
  console.error('[routes] Failed to register /api/returns/:id/reopen:', err.message)
}


// GET /api/products – read products from dship.products
try {
  app.get('/api/products', async (req, res) => {
    try {
      const database = await getDb()
      const docs = await database.collection('products').find({}).limit(50).toArray()
      const out = docs.map(d => ({
        id: String(d._id),
        title: String(d.title || ''),
        brand: d.brand == null ? '' : String(d.brand),
        price: Number(d.price || 0) || 0,
        compareAtPrice: d.compareAtPrice == null ? null : (Number(d.compareAtPrice) || 0),
        images: Array.isArray(d.images) ? d.images : [],
        heroImages: Array.isArray(d.heroImages) ? d.heroImages : [],
        bullets: Array.isArray(d.bullets) ? d.bullets : [],
        description: d.description == null ? '' : String(d.description),
        descriptionHeading: d.descriptionHeading == null ? '' : String(d.descriptionHeading),
        descriptionPoints: Array.isArray(d.descriptionPoints) ? d.descriptionPoints : [],
        youtubeUrl: d.youtubeUrl == null ? '' : String(d.youtubeUrl),
        video: d.video == null ? '' : String(d.video),
        testimonials: Array.isArray(d.testimonials) ? d.testimonials : [],
        sku: d.sku == null ? '' : String(d.sku),
        slug: d.slug == null ? '' : String(d.slug),
        inventoryStatus: String(d.inventoryStatus || 'IN_STOCK'),
        ratingAvg: d.ratingAvg == null ? undefined : Number(d.ratingAvg),
        ratingCount: d.ratingCount == null ? undefined : Number(d.ratingCount),
      }))
      res.json(out)
    } catch (err) {
      console.error('GET /api/products error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/products registered')
} catch (err) {
  console.error('[routes] Failed to register /api/products:', err.message)
}

// ----- Admin products (CRUD) -----
function sanitizeString(v, max = 5000) {
  return String(v == null ? '' : v).trim().slice(0, max)
}
function sanitizeStringArray(arr, maxItems = 20, maxItemLen = 500) {
  if (!Array.isArray(arr)) return []
  return arr
    .map(x => sanitizeString(x, maxItemLen))
    .filter(Boolean)
    .slice(0, maxItems)
}
function sanitizePrice(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100) / 100)
}
function sanitizeTestimonials(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .map(t => ({
      author: sanitizeString(t?.author, 100),
      quote: sanitizeString(t?.quote, 500),
      rating: Math.min(5, Math.max(1, Number(t?.rating) || 5)),
    }))
    .filter(t => t.author && t.quote)
    .slice(0, 50)
}
function coerceObjectId(idStr) {
  try { return new ObjectId(String(idStr)) } catch { return String(idStr) }
}

// Admin: list products (supports ?q=, ?limit=, ?skip=)
try {
  app.get('/api/products/admin', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return
      const database = await getDb()

      const qRaw = sanitizeString(req.query?.q, 200)
      const limit = Math.min(1000, Math.max(1, Number(req.query?.limit || 200) || 200))
      const skip = Math.min(5000, Math.max(0, Number(req.query?.skip || 0) || 0))

      const query = {}
      if (qRaw) {
        const re = new RegExp(qRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.$or = [{ title: re }, { sku: re }, { brand: re }]
      }

      const docs = await database
        .collection('products')
        .find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const out = docs.map(d => ({
        id: String(d._id),
        title: String(d.title || ''),
        brand: d.brand == null ? '' : String(d.brand),
        price: Number(d.price || 0) || 0,
        compareAtPrice: d.compareAtPrice == null ? null : (Number(d.compareAtPrice) || 0),
        images: Array.isArray(d.images) ? d.images : [],
        heroImages: Array.isArray(d.heroImages) ? d.heroImages : [],
        bullets: Array.isArray(d.bullets) ? d.bullets : [],
        description: d.description == null ? '' : String(d.description),
        descriptionHeading: d.descriptionHeading == null ? '' : String(d.descriptionHeading),
        descriptionPoints: Array.isArray(d.descriptionPoints) ? d.descriptionPoints : [],
        youtubeUrl: d.youtubeUrl == null ? '' : String(d.youtubeUrl),
        video: d.video == null ? '' : String(d.video),
        testimonials: Array.isArray(d.testimonials) ? d.testimonials : [],
        sku: d.sku == null ? '' : String(d.sku),
        slug: d.slug == null ? '' : String(d.slug),
        inventoryStatus: String(d.inventoryStatus || 'IN_STOCK'),
        ratingAvg: d.ratingAvg == null ? undefined : Number(d.ratingAvg),
        ratingCount: d.ratingCount == null ? undefined : Number(d.ratingCount),
        createdAt: d.createdAt || null,
        updatedAt: d.updatedAt || null,
      }))
      res.json({ products: out })
    } catch (err) {
      console.error('GET /api/products/admin error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] /api/products/admin registered')
} catch (err) {
  console.error('[routes] Failed to register /api/products/admin:', err.message)
}

// Admin: create product
try {
  app.post('/api/products/admin', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return
      const body = req.body || {}

      const title = sanitizeString(body.title, 200)
      const sku = sanitizeString(body.sku, 80)
      const price = sanitizePrice(body.price)
      const compareAtPrice = body.compareAtPrice == null || body.compareAtPrice === '' ? null : sanitizePrice(body.compareAtPrice)

      if (!title) return res.status(400).json({ error: 'title_required' })
      if (!sku) return res.status(400).json({ error: 'sku_required' })

      const doc = {
        title,
        slug: sanitizeString(body.slug, 200),
        brand: sanitizeString(body.brand, 120),
        price,
        compareAtPrice,
        images: sanitizeStringArray(body.images, 10, 2000),
        heroImages: sanitizeStringArray(body.heroImages, 10, 2000),
        bullets: sanitizeStringArray(body.bullets, 20, 200),
        description: sanitizeString(body.description, 20000),
        descriptionHeading: sanitizeString(body.descriptionHeading, 200),
        descriptionPoints: sanitizeStringArray(body.descriptionPoints, 20, 200),
        youtubeUrl: sanitizeString(body.youtubeUrl, 2000),
        video: sanitizeString(body.video, 2000),
        testimonials: sanitizeTestimonials(body.testimonials),
        ratingAvg: body.ratingAvg == null || body.ratingAvg === '' ? null : Math.min(5, Math.max(0, Number(body.ratingAvg) || 0)),
        ratingCount: body.ratingCount == null || body.ratingCount === '' ? null : Math.max(0, Number(body.ratingCount) || 0),
        sku,
        inventoryStatus: sanitizeString(body.inventoryStatus || 'IN_STOCK', 40) || 'IN_STOCK',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const database = await getDb()
      // best-effort SKU uniqueness guard
      const existing = await database.collection('products').findOne({ sku }, { projection: { _id: 1 } })
      if (existing) return res.status(409).json({ error: 'sku_exists' })

      const ins = await database.collection('products').insertOne(doc)
      res.json({ id: String(ins.insertedId) })
    } catch (err) {
      console.error('POST /api/products/admin error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] POST /api/products/admin registered')
} catch (err) {
  console.error('[routes] Failed to register POST /api/products/admin:', err.message)
}

// Admin: update product (partial)
try {
  app.patch('/api/products/admin/:id', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ error: 'missing_id' })
      const body = req.body || {}

      const $set = { updatedAt: new Date() }
      const has = (k) => Object.prototype.hasOwnProperty.call(body, k)

      if (has('title')) $set.title = sanitizeString(body.title, 200)
      if (has('slug')) $set.slug = sanitizeString(body.slug, 200)
      if (has('brand')) $set.brand = sanitizeString(body.brand, 120)
      if (has('price')) $set.price = sanitizePrice(body.price)
      if (has('compareAtPrice')) $set.compareAtPrice = body.compareAtPrice == null || body.compareAtPrice === '' ? null : sanitizePrice(body.compareAtPrice)
      if (has('images')) $set.images = sanitizeStringArray(body.images, 10, 2000)
      if (has('heroImages')) $set.heroImages = sanitizeStringArray(body.heroImages, 10, 2000)
      if (has('bullets')) $set.bullets = sanitizeStringArray(body.bullets, 20, 200)
      if (has('description')) $set.description = sanitizeString(body.description, 20000)
      if (has('descriptionHeading')) $set.descriptionHeading = sanitizeString(body.descriptionHeading, 200)
      if (has('descriptionPoints')) $set.descriptionPoints = sanitizeStringArray(body.descriptionPoints, 20, 200)
      if (has('youtubeUrl')) $set.youtubeUrl = sanitizeString(body.youtubeUrl, 2000)
      if (has('video')) $set.video = sanitizeString(body.video, 2000)
      if (has('testimonials')) $set.testimonials = sanitizeTestimonials(body.testimonials)
      if (has('ratingAvg')) $set.ratingAvg = body.ratingAvg == null || body.ratingAvg === '' ? null : Math.min(5, Math.max(0, Number(body.ratingAvg) || 0))
      if (has('ratingCount')) $set.ratingCount = body.ratingCount == null || body.ratingCount === '' ? null : Math.max(0, Number(body.ratingCount) || 0)
      if (has('sku')) $set.sku = sanitizeString(body.sku, 80)
      if (has('inventoryStatus')) $set.inventoryStatus = sanitizeString(body.inventoryStatus, 40)

      if ($set.title !== undefined && !$set.title) return res.status(400).json({ error: 'title_required' })
      if ($set.sku !== undefined && !$set.sku) return res.status(400).json({ error: 'sku_required' })

      const database = await getDb()
      const filter = { _id: coerceObjectId(id) }

      if ($set.sku) {
        const dupe = await database.collection('products').findOne({ sku: $set.sku, _id: { $ne: filter._id } }, { projection: { _id: 1 } })
        if (dupe) return res.status(409).json({ error: 'sku_exists' })
      }

      const upd = await database.collection('products').updateOne(filter, { $set })
      if (!upd.matchedCount) return res.status(404).json({ error: 'Not found' })
      const doc = await database.collection('products').findOne(filter)
      if (!doc) return res.status(404).json({ error: 'Not found' })
      res.json({ ok: true, product: { id: String(doc._id), ...doc } })
    } catch (err) {
      console.error('PATCH /api/products/admin/:id error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] PATCH /api/products/admin/:id registered')
} catch (err) {
  console.error('[routes] Failed to register PATCH /api/products/admin/:id:', err.message)
}

// Admin: delete product
try {
  app.delete('/api/products/admin/:id', async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return
      const id = String(req.params.id || '')
      if (!id) return res.status(400).json({ error: 'missing_id' })
      const database = await getDb()
      const filter = { _id: coerceObjectId(id) }
      const del = await database.collection('products').deleteOne(filter)
      if (!del.deletedCount) return res.status(404).json({ error: 'Not found' })
      res.json({ ok: true })
    } catch (err) {
      console.error('DELETE /api/products/admin/:id error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] DELETE /api/products/admin/:id registered')
} catch (err) {
  console.error('[routes] Failed to register DELETE /api/products/admin/:id:', err.message)
}


// POST /api/orders – insert order into dship.orders (idempotent via optional requestId)
try {
  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body || {}

      // Coerce all incoming fields to the expected types to avoid intermittent type errors
      const name = String(body?.name ?? '').trim()
      const email = String(body?.email ?? '').trim().toLowerCase()
      const phone = String(body?.phone ?? '').trim()

      const address = {
        country: String(body?.address?.country ?? '').trim(),
        line1: String(body?.address?.line1 ?? '').trim(),
        line2: String(body?.address?.line2 ?? '').trim(),
        city: String(body?.address?.city ?? '').trim(),
        state: String(body?.address?.state ?? '').trim(),
        zip: String(body?.address?.zip ?? '').trim(),
      }

      // Validate required fields
      const requiredStrings = [name, email, phone, address.country, address.line1, address.city, address.state, address.zip]
      if (requiredStrings.some(v => !v || typeof v !== 'string')) {
        return res.status(400).json({ error: 'missing_required_fields' })
      }

      // Validate and normalize items
      const itemsIn = Array.isArray(body.items) ? body.items : []
      if (itemsIn.length === 0) return res.status(400).json({ error: 'no_items' })
      const items = itemsIn.map((i) => ({
        productId: String(i?.productId ?? ''),
        title: String(i?.title ?? ''),
        quantity: Math.max(1, Number(i?.quantity ?? 0) || 0),
        unitPrice: Math.max(0, Number(i?.unitPrice ?? 0) || 0),
      }))

      // Totals: trust server calculations when client is off
      const subtotal = items.reduce((a, i) => a + (i.unitPrice * i.quantity), 0)
      const clientTotals = body?.totals || {}
      const shipping = Number(clientTotals.shipping ?? 0) || 0
      const tax = Number(clientTotals.tax ?? 0) || 0
      const total = subtotal + shipping + tax

      const pm = String(body?.paymentMethod || 'cod').toLowerCase()
      const paymentMethod = ['phonepe','razorpay','paytm'].includes(pm) ? pm : 'cod'
      const payment = body?.payment && typeof body.payment === 'object' ? body.payment : null
      const stateUpper = String(payment?.state || '').toUpperCase()
      const isPaid = paymentMethod !== 'cod' && (
        payment?.captured ||
        (payment?.provider === 'phonepe' && stateUpper === 'COMPLETED') ||
        (payment?.provider === 'paytm' && (stateUpper === 'TXN_SUCCESS' || stateUpper === 'SUCCESS'))
      )
      const status = isPaid ? 'paid' : 'pending'

      const requestId = String(body?.requestId || '').trim()

      const doc = {
        customer: { name, email, phone },
        address,
        items,
        totals: { subtotal, shipping, tax, total },
        paymentMethod,
        payment,
        status,
        createdAt: new Date(),
        source: 'website',
      }

      const database = await getDb()
      const coll = database.collection('orders')

      let orderId = null
      let newlyCreated = false

      if (requestId) {
        const result = await coll.updateOne(
          { requestId },
          { $setOnInsert: { ...doc, requestId } },
          { upsert: true }
        )
        if (result.upsertedId) {
          newlyCreated = true
          orderId = String(result.upsertedId._id ?? result.upsertedId)
        } else {
          const existing = await coll.findOne({ requestId }, { projection: { _id: 1 } })
          if (existing) orderId = String(existing._id)
        }
        if (!orderId) {
          // Fallback: create once if somehow neither upsert nor find returned
          const ins = await coll.insertOne({ ...doc, requestId })
          newlyCreated = true
          orderId = String(ins.insertedId)
        }
      } else {
        const ins = await coll.insertOne(doc)
        newlyCreated = true
        orderId = String(ins.insertedId)
      }

      // Fire-and-forget emails (do not block response). Only on first creation.
      if (newlyCreated && orderId) {
        const customerEmail = email
        const ownerEmail = process.env.ORDERS_EMAIL || process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
        sendOrderPlacedEmail({ to: customerEmail, orderId, customer: doc.customer, items: doc.items, totals: doc.totals }).catch(()=>{})
        sendOrderReceivedEmailToOwner({ to: ownerEmail, orderId, customer: doc.customer, items: doc.items, totals: doc.totals }).catch(()=>{})
      }

      res.json({ id: orderId })
    } catch (err) {
      console.error('POST /api/orders error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] POST /api/orders registered')
} catch (err) {
  console.error('[routes] Failed to register POST /api/orders:', err.message)
}

// Find orders by customer email or phone (recent first)
try {
  app.get('/api/orders/search', async (req, res) => {
    try {
      const { email, phone } = req.query || {}
      if (!email && !phone) return res.status(400).json({ error: 'email or phone required' })
      const database = await getDb()
      const q = {}
      if (email) q['customer.email'] = String(email)
      if (phone) q['customer.phone'] = String(phone)
      const docs = await database.collection('orders').find(q).sort({ createdAt: -1 }).limit(200).toArray()
      const out = docs.map(d => ({ id: String(d._id), createdAt: d.createdAt, status: d.status, total: d.totals?.total, itemsCount: (d.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0) }))
      res.json(out)
    } catch (err) {
      console.error('GET /api/orders/search error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] GET /api/orders/search registered')
} catch (err) {
  console.error('[routes] Failed to register GET /api/orders/search:', err.message)
}

// Admin orders with optional date range (requires ADMIN_EMAIL or ADMIN_SECRET)
try {
  app.get('/api/orders/admin', async (req, res) => {
    try {
      const { start, end, adminEmail, secret } = req.query || {}
      const allowed = (process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET) || (process.env.ADMIN_EMAIL && adminEmail === process.env.ADMIN_EMAIL)
      if (!allowed) return res.status(403).json({ error: 'Forbidden' })

      const database = await getDb()
      const range = {}
      if (start) range.$gte = new Date(String(start))
      if (end) range.$lte = new Date(String(end))
      const q = Object.keys(range).length ? { createdAt: range } : {}

      const docs = await database.collection('orders').find(q).sort({ createdAt: -1 }).limit(1000).toArray()
      const out = docs.map(d => ({
        id: String(d._id), createdAt: d.createdAt, status: d.status,
        customer: d.customer, total: d.totals?.total, items: d.items || []
      }))
      res.json(out)
    } catch (err) {
      console.error('GET /api/orders/admin error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] GET /api/orders/admin registered')
} catch (err) {
  console.error('[routes] Failed to register GET /api/orders/admin:', err.message)
}


// GET /api/orders/:id – fetch by id
try {
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const database = await getDb()
      const idStr = String(req.params.id)
      let filter
      try { filter = { _id: new ObjectId(idStr) } } catch { filter = { _id: idStr } }
      const doc = await database.collection('orders').findOne(filter)
      if (!doc) return res.status(404).json({ error: 'Not found' })
      res.json({ id: String(doc._id), ...doc })
    } catch (err) {
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] GET /api/orders/:id registered')
} catch (err) {
  console.error('[routes] Failed to register GET /api/orders/:id:', err.message)
}

// Admin: update order status (pending | accepted | delivered)
try {
  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const email = parseDemoToken(req.headers.authorization)
      const adminEmail = process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com'
      if (!email || email !== adminEmail) return res.status(403).json({ error: 'Forbidden' })

      const status = String(req.body?.status || '').toLowerCase()
      const allowed = new Set(['pending', 'accepted', 'delivered'])
      if (!allowed.has(status)) return res.status(400).json({ error: 'invalid_status' })

      const database = await getDb()
      const idStr = String(req.params.id)
      let filter
      try { filter = { _id: new ObjectId(idStr) } } catch { filter = { _id: idStr } }

      const upd = await database.collection('orders').updateOne(filter, { $set: { status, updatedAt: new Date() } })
      if (!upd.matchedCount) return res.status(404).json({ error: 'Not found' })

      const doc = await database.collection('orders').findOne(filter)
      if (!doc) return res.status(404).json({ error: 'Not found' })

      const out = {
        id: String(doc._id), createdAt: doc.createdAt, status: doc.status,
        customer: doc.customer, address: doc.address, paymentMethod: doc.paymentMethod,
        totals: doc.totals, total: doc.totals?.total, items: doc.items || [],
        itemsCount: (doc.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0)
      }
      res.json(out)
    } catch (err) {
      console.error('PATCH /api/orders/:id/status error', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })
  console.log('[routes] PATCH /api/orders/:id/status registered')
} catch (err) {
  console.error('[routes] Failed to register PATCH /api/orders/:id/status:', err.message)
}

// Serve index.html for all non-API routes (client-side routing)
if (fs.existsSync(FRONTEND_DIST)) {
  try {
    app.get(/^(?!\/api\/).*$/, (req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
    })
    console.log('[routes] GET /^(?!\\/api\\/).*$/ (catch-all) registered')
  } catch (err) {
    console.error('[routes] Failed to register catch-all route:', err.message)
  }
}

// Export app for serverless adapters and start only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`)
    // Warm DB connection and keep alive to avoid cold-start delays
    getDb().then(() => console.log('[db] connected (warmed)')).catch(console.error)
    setInterval(() => {
      getDb()
        .then(db => db.command({ ping: 1 }))
        .catch(() => {})
    }, 240000) // every 4 minutes
  })
}

module.exports = app
