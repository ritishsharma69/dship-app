import express from 'express'
import crypto from 'crypto'
import https from 'https'

// Minimal Express app for Vercel serverless (project root = my-app)
const app = express()
app.use(express.json())

// In-memory orders (for test mode / integration). Not persistent.
const memOrders = []

// Health
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() })
})

// Create Razorpay order
app.post(['/api/payments/razorpay/order', '/payments/razorpay/order'], (req, res) => {
  try {
    const key = process.env.RAZORPAY_KEY_ID
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!key || !secret) return res.status(500).json({ error: 'Missing Razorpay keys' })

    const amountRupees = Math.round(Number(req.body?.amount || 0))
    const receipt = String(req.body?.receipt || `rcpt_${Date.now()}`)
    if (!amountRupees || amountRupees <= 0) return res.status(400).json({ error: 'amount required' })

    const payload = JSON.stringify({ amount: amountRupees * 100, currency: 'INR', receipt, payment_capture: 1 })
    const auth = Buffer.from(`${key}:${secret}`).toString('base64')

    const options = {
      hostname: 'api.razorpay.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }

    const req2 = https.request(options, (resp) => {
      let data = ''
      resp.on('data', (chunk) => { data += chunk })
      resp.on('end', () => {
        if (resp.statusCode && resp.statusCode >= 200 && resp.statusCode < 300) {
          try { return res.json({ order: JSON.parse(data) }) } catch { return res.json({ order: data }) }
        } else {
          return res.status(resp.statusCode || 500).send(data || 'Payment init failed')
        }
      })
    })

    req2.on('error', (e) => {
      console.error('Razorpay order error', e)
      res.status(500).json({ error: 'payment_init_failed' })
    })
    req2.write(payload)
    req2.end()
  } catch (err) {
    console.error('POST /api/payments/razorpay/order error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Verify Razorpay signature
app.post(['/api/payments/razorpay/verify', '/payments/razorpay/verify'], (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ valid: false, error: 'Missing params' })
    }
    const signStr = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', secret || '').update(signStr).digest('hex')
    res.json({ valid: expected === razorpay_signature })
  } catch (err) {
    console.error('POST /api/payments/razorpay/verify error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// OTP (in-memory cache) – email send optional based on SMTP env
const otpCache = new Map()
function generateOtp() { return String(Math.floor(100000 + Math.random() * 900000)) }

async function getMailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  try {
    const { default: nodemailer } = await import('nodemailer')
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    return nodemailer.createTransport({ host: SMTP_HOST, port, secure, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  } catch { return null }
}

async function sendOtpEmail({ to, code }) {
  const transporter = await getMailer()
  if (!transporter) return false
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER
  const store = process.env.STORE_NAME || 'Store'
  const html = `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
    <h2 style="margin:0 0 8px">${store}: Your OTP Code</h2>
    <div style="font-size:28px; letter-spacing: 6px; font-weight: 800; background:#f8fafc; border:1px solid #e5e7eb; padding:12px 16px; display:inline-block; border-radius:10px;">${code}</div>
    <p style="color:#6b7280; font-size:12px; margin-top:10px;">This code will expire in 5 minutes. Do not share this code with anyone.</p>
  </div>`
  const text = `Your OTP code is: ${code}. It expires in 5 minutes.`
  try { await transporter.sendMail({ from, to, subject: `${store}: Your OTP Code`, html, text }); return true } catch { return false }
}

app.post(['/api/auth/request-otp', '/auth/request-otp'], async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' })
    const code = generateOtp()
    otpCache.set(email, { code, expires: Date.now() + 5 * 60 * 1000 })
    await sendOtpEmail({ to: email, code }) // best-effort
    res.json({ ok: true })
  } catch (err) { console.error('POST /api/auth/request-otp error', err); res.status(500).json({ error: 'Internal error' }) }
})

app.post(['/api/auth/verify-otp', '/auth/verify-otp'], async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const code = String(req.body?.code || '').trim()
    const rec = otpCache.get(email)
    if (!rec || rec.code !== code || rec.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired code' })
    otpCache.delete(email)
    const token = Buffer.from(`${email}|${Date.now()}`).toString('base64')
    res.json({ token, email })
  } catch (err) { console.error('POST /api/auth/verify-otp error', err); res.status(500).json({ error: 'Internal error' }) }
})

// Returns endpoint: send email to owner and confirmation to customer (if SMTP set)
app.post(['/api/returns', '/returns'], async (req, res) => {
  try {
    const body = req.body || {}
    const orderId = String(body.orderId || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' })
    const transporter = await getMailer()
    if (!transporter) return res.json({ ok: true, simulated: true })
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER
    const store = process.env.STORE_NAME || 'Store'
    const owner = process.env.RETURNS_EMAIL || process.env.ADMIN_EMAIL || email
    await transporter.sendMail({ from, to: owner, subject: `${store}: Return request (#${orderId})`, html: `<p>Return request for <b>#${orderId}</b> from <b>${email}</b></p>` })
    await transporter.sendMail({ from, to: email, subject: `${store}: Return request received (#${orderId})`, html: `<p>We have received your return request for order <b>#${orderId}</b>. Our team will review and contact you soon.</p>` })
    res.json({ ok: true })
  } catch (err) { console.error('POST /api/returns error', err); res.status(500).json({ error: 'Internal error' }) }
})

// Create order (memory) – for integration/testing. Replace with DB in production.
app.post(['/api/orders', '/orders'], (req, res) => {
  try {
    const body = req.body || {}
    if (!body?.name || !body?.address?.line1 || !Array.isArray(body?.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'Invalid order' })
    }
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const doc = { id, ...body, createdAt: new Date().toISOString() }
    memOrders.push(doc)
    res.json({ id })
  } catch (err) {
    console.error('POST /api/orders error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

export default function handler(req, res) { return app(req, res) }

