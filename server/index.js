require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')

const app = express()
const PORT = process.env.PORT || 5000

// CORS: allow local dev and any origins listed in ALLOWED_ORIGINS (comma-separated)
const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const allowAll = allowedFromEnv.includes('*')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok =
      allowAll ||
      allowedFromEnv.includes(origin) ||
      origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') ||
      origin.startsWith('http://127.0.0.1:') || origin.startsWith('https://127.0.0.1:')
    cb(null, !!ok)
  },
  credentials: false
}))
// Respond to CORS preflight requests for all routes
// Note: app.use(cors({...})) above will handle OPTIONS requests automatically.


app.use(express.json({ limit: '5mb' }))

// Lightweight ping to keep server warm and for client health-check
app.get('/api/ping', (req, res) => res.json({ ok: true, t: Date.now() }))


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

// ----- Razorpay (optional online payments) -----
const https = require('https')
const crypto = require('crypto')

function razorpayRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) return reject(new Error('Razorpay not configured'))

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const body = data ? JSON.stringify(data) : ''

    const req = https.request({
      hostname: 'api.razorpay.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (r) => {
      let buf = ''
      r.on('data', (d) => (buf += d))
      r.on('end', () => {
        try {
          const json = JSON.parse(buf || '{}')
          if (r.statusCode >= 200 && r.statusCode < 300) return resolve(json)
          const msg = json?.error?.description || `Razorpay API error (${r.statusCode})`
          return reject(new Error(msg))
        } catch (e) {
          return reject(new Error(`Razorpay parse error: ${buf}`))
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
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
      console.warn('[mail] transporter not configured. OTP:', code)
      return false
    }
    await transporter.sendMail({ from, to, subject: `${store} — Your OTP to Sign In`, html, text })
    return true
  } catch (err) {
    console.error('[mail] otp send failed', err)
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
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' })
    const code = generateOtp()
    const coll = await getOtpCollection()
    await coll.updateOne(
      { email },
      { $set: { email, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } },
      { upsert: true }
    )

    // send OTP email in background (do not block response to avoid client timeouts)
    sendOtpEmail({ to: email, code }).catch(() => {})

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/request-otp error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Verify OTP and return a short-lived token (unsigned demo token)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const code = String(req.body?.code || '').trim()
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

function parseDemoToken(authHeader) {
  const raw = (authHeader || '').replace(/^Bearer\s+/i, '')
  try { return Buffer.from(raw, 'base64').toString('utf8').split('|')[0] } catch { return null }
}

// Unified orders endpoint: if email is admin, return all; else return own
app.get('/api/orders/me', async (req, res) => {
  try {
    const email = parseDemoToken(req.headers.authorization)
    if (!email) return res.status(401).json({ error: 'Unauthorized' })
    const database = await getDb()

    const isAdmin = email === (process.env.ADMIN_EMAIL || 'khushiyanstore@gmail.com')
    const q = isAdmin ? {} : { 'customer.email': email }

    const docs = await database.collection('orders').find(q).sort({ createdAt: -1 }).limit(1000).toArray()
    const out = docs.map(d => ({
      id: String(d._id), createdAt: d.createdAt, status: d.status,
      customer: d.customer, address: d.address, paymentMethod: d.paymentMethod,
      totals: d.totals, total: d.totals?.total, items: d.items || [],
      itemsCount: (d.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0)
    }))
    res.json({ email, isAdmin, orders: out })
  } catch (err) {
    console.error('GET /api/orders/me error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() })
})

// Friendly root route so hitting http://localhost:5000/ doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.type('text/plain').send('DShip backend is running. Try: GET /api/health, GET /api/products, POST /api/orders')
})



// Online payments temporarily disabled — return friendly message
app.post('/api/payments/razorpay/order', (req, res) => {
  return res.status(503).json({
    error: 'payment_disabled',
    message: 'Online payments are temporarily disabled. Please choose Cash on Delivery (COD).'
  })
})

// Online payments temporarily disabled — verification not available
app.post('/api/payments/razorpay/verify', (req, res) => {
  return res.status(503).json({
    error: 'payment_disabled',
    message: 'Online payments are temporarily disabled. Please use COD.'
  })
})

// Submit return request – emails store owner and sends confirmation to customer
app.post('/api/returns', async (req, res) => {
  try {
    const body = req.body || {}
    const orderId = String(body.orderId || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const reasons = Array.isArray(body.reasons) ? body.reasons.slice(0, 10) : []
    const custom = String(body.customReason || '').trim()
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []

    if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' })

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
      cidImgs.push(`<img src="cid:${cid}" alt="photo" style="max-width:420px; display:block; margin:6px 0; border-radius:8px; border:1px solid #e5e7eb"/>`)
    }

    const ownerHtml = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6">
        <h2 style="margin:0 0 8px">${store}: New Return Request</h2>
        <p><b>Order:</b> #${orderId}</p>
        <p><b>Customer:</b> ${email}</p>
        ${reasons.length ? `<div><b>Reasons:</b><ul>${reasonList}</ul></div>` : ''}
        ${custom ? `<div><b>Details:</b><div>${custom}</div></div>` : ''}
        ${cidImgs.join('')}
      </div>`
    const ownerText = `Return request\nOrder: #${orderId}\nCustomer: ${email}\nReasons: ${reasons.join(', ')}\nDetails: ${custom}`

    if (!transporter) {
      console.warn('[mail] transporter not configured. Return request:', { orderId, email, reasons, custom, images: images.length })
      return res.json({ ok: true, simulated: true })
    }

    await transporter.sendMail({ from, to: owner, subject: `${store}: Return request (#${orderId})`, html: ownerHtml, text: ownerText, attachments })
    await transporter.sendMail({ from, to: email, subject: `${store}: Return request received (#${orderId})`, html: `<p>We have received your return request for order <b>#${orderId}</b>. Our team will review and contact you soon.</p>`, text: `We have received your return request for order #${orderId}.` })

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/returns error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// GET /api/products – read products from dship.products
app.get('/api/products', async (req, res) => {
  try {
    const database = await getDb()
    const docs = await database.collection('products').find({}).limit(50).toArray()
    const out = docs.map(d => ({
      id: String(d._id),
      title: d.title,
      brand: d.brand,
      price: d.price,
      compareAtPrice: d.compareAtPrice,
      images: d.images || [],
      bullets: d.bullets || [],
      description: d.description,
      descriptionHeading: d.descriptionHeading,
      descriptionPoints: d.descriptionPoints || [],
      youtubeUrl: d.youtubeUrl,
      video: d.video,
      sku: d.sku,
      inventoryStatus: d.inventoryStatus || 'IN_STOCK',
    }))
    res.json(out)
  } catch (err) {
    console.error('GET /api/products error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})


// POST /api/orders – insert order into dship.orders (idempotent via optional requestId)
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

    const paymentMethod = String(body?.paymentMethod || 'cod').toLowerCase() === 'razorpay' ? 'razorpay' : 'cod'
    const payment = body?.payment && typeof body.payment === 'object' ? body.payment : null
    const status = payment?.captured ? 'paid' : 'pending'

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

// Find orders by customer email or phone (recent first)
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

// Admin orders with optional date range (requires ADMIN_EMAIL or ADMIN_SECRET)
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


// GET /api/orders/:id – fetch by id
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

// Admin: update order status (pending | accepted | delivered)
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
