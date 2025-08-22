import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const app = express()
app.use(express.json())

const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']
app.use(cors({ origin: CORS_ORIGIN }))

// ========== MAILER ==========
const MAIL_FROM = process.env.MAIL_FROM || 'Khushiyan Store <khushiyanstore@gmail.com>'
const STORE_EMAIL = (process.env.STORE_EMAIL || 'khushiyanstore@gmail.com').toLowerCase()
let transporter: nodemailer.Transporter | null = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE||'true')==='true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
} else {
  console.warn('SMTP not configured. Emails will be logged to console.')
}
const BRAND = 'Khushiyan Store'
function wrapEmail(bodyHtml: string) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f8fa;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#ff2a6d;color:#fff;padding:14px 18px;font-weight:700">${BRAND}</div><div style="padding:18px">${bodyHtml}</div><div style="border-top:1px solid #e5e7eb;padding:12px 18px;color:#6b7280;font-size:12px">This is an automated message from ${BRAND}.</div></div></body></html>`
}
async function sendMail(to: string|string[], subject: string, html: string) {
  if (!transporter) { console.log('[MAIL:DEV]', { to, subject }); return { preview: true } }
  const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html })
  console.log('Mail sent:', info.messageId)
  return info
}

// ========== DB MODELS ==========
const OrderSchema = new mongoose.Schema({
  email: String, name: String, phone: String,
  address: { country: String, line1: String, line2: String, city: String, state: String, zip: String },
  items: [{ productId: String, title: String, quantity: Number, unitPrice: Number }],
  totals: { subtotal: Number, shipping: Number, tax: Number, total: Number },
  paymentMethod: String, payment: {}, status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
},{versionKey:false})
const Order = mongoose.model('Order', OrderSchema)

const ReturnSchema = new mongoose.Schema({ orderId: String, email: String, reasons: [String], customReason: String, images: [String], createdAt: { type: Date, default: Date.now } }, {versionKey:false})
const ReturnRequest = mongoose.model('ReturnRequest', ReturnSchema)

const OtpSchema = new mongoose.Schema({ email: String, code: String, expiresAt: Date, createdAt: { type: Date, default: Date.now } }, {versionKey:false})
const Otp = mongoose.model('Otp', OtpSchema)

// ========== UTILS ==========
const SECRET = process.env.JWT_SECRET || 'dev-secret'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
const ADMIN_SET = new Set<string>([...ADMIN_EMAILS, STORE_EMAIL].filter(Boolean))
const isAdminEmail = (email: string) => ADMIN_SET.has(email.toLowerCase())
const b64 = (s:string)=>Buffer.from(s).toString('base64url')
const ub64 = (s:string)=>Buffer.from(s,'base64url').toString()
function signToken(payload: any){ const h=b64(JSON.stringify({alg:'HS256',typ:'JWT'})); const b=b64(JSON.stringify(payload)); const sig=crypto.createHmac('sha256',SECRET).update(`${h}.${b}`).digest('base64url'); return `${h}.${b}.${sig}` }
function verifyToken(tok?: string){ if(!tok) return null; const [h,b,s]=tok.split('.'); if(!h||!b||!s) return null; const sig=crypto.createHmac('sha256',SECRET).update(`${h}.${b}`).digest('base64url'); if(sig!==s) return null; try { return JSON.parse(ub64(b)) } catch { return null } }
function auth(req: any, res: any, next: any){ const m=(req.headers.authorization||'').match(/^Bearer (.+)$/); const user=verifyToken(m?.[1]); if(!user) return res.status(401).send('Unauthorized'); req.user=user; next() }

// Basic health endpoint also reports DB status
app.get('/health', async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1
  res.json({ ok: true, db: dbOk ? 'connected' : 'disconnected', time: new Date().toISOString() })
})

// ========== AUTH (OTP) ==========
app.post('/api/auth/request-otp', async (req, res)=>{
  const email = String(req.body?.email||'').trim().toLowerCase()
  if(!/\S+@\S+\.\S+/.test(email)) return res.status(400).send('Invalid email')
  const code = String(Math.floor(100000+Math.random()*900000))
  const expires = new Date(Date.now()+10*60*1000)
  await Otp.findOneAndUpdate({email},{email,code,expiresAt:expires},{upsert:true})
  // Send email
  await sendMail(email, 'Your OTP for Khushiyan Store', wrapEmail(`<p>Hi,</p><p>Your one-time password is</p><div style='font-size:28px;font-weight:800;letter-spacing:4px'>${code}</div><p style='color:#6b7280'>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>`))
  res.json({ message:'OTP sent' })
})

// Dev-only helper to read OTP for testing
const IS_PROD = process.env.NODE_ENV === 'production'
if (!IS_PROD) {
  app.get('/api/auth/dev-otp', async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase()
    if (!email) return res.status(400).send('email required')
    const rec = await Otp.findOne({ email })
    res.json({ code: rec?.code || null })
  })
}

app.post('/api/auth/verify-otp', async (req,res)=>{
  const email = String(req.body?.email||'').trim().toLowerCase()
  const code = String(req.body?.code||'').trim()
  if(!email||!code) return res.status(400).send('Missing')
  const rec = await Otp.findOne({email})
  if(!rec || rec.code!==code || (rec.expiresAt && rec.expiresAt < new Date())) return res.status(400).send('Invalid OTP')
  await Otp.deleteOne({email})
  const isAdmin = ADMIN_SET.has(email)
  const token = signToken({ email, isAdmin, iat: Date.now() })
  res.json({ token, isAdmin })
})

// ========== ORDERS ==========
app.post('/api/orders', async (req,res)=>{
  const b=req.body||{}
  if(!b.email || !Array.isArray(b.items) || !b.totals) return res.status(400).send('Bad payload')
  const doc = await Order.create({ ...b, status: b.payment?.captured ? 'accepted' : 'pending' })
  // Notify customer
  try {
    await sendMail(
      b.email,
      'Your order has been placed',
      wrapEmail(`<p>Hi ${b.name||''},</p><p>Thanks for your order!</p><p><b>Order ID:</b> ${doc._id}</p><p><b>Total:</b> ₹${b.totals?.total}</p><p>We will notify you when it ships.</p>`)
    )
  } catch {}
  // Notify store
  try {
    await sendMail(
      STORE_EMAIL,
      'New order received',
      wrapEmail(`<p>New order <b>${doc._id}</b></p><p>Customer: ${b.name||''} (${b.email})</p><p>Total: ₹${b.totals?.total}</p>`)
    )
  } catch {}
  res.json({ id: doc._id })
})

app.get('/api/orders/me', auth, async (req:any,res:any)=>{
  const isAdmin = !!req.user?.isAdmin
  const email = String(req.user?.email||'').toLowerCase()
  const q = isAdmin ? {} : { email }
  const docs = await Order.find(q).sort({ createdAt: -1 })
  const orders = docs.map(d=>({ id: d._id.toString(), createdAt: d.createdAt, status: d.status, total: d.totals?.total, itemsCount: (d.items||[]).reduce((n:any,i:any)=>n+Number(i.quantity||0),0), customer: { email: d.email, name: d.name }, address: d.address, items: d.items, paymentMethod: d.paymentMethod, totals: d.totals }))
  res.json({ isAdmin, orders })
})

app.patch('/api/orders/:id/status', auth, async (req:any,res:any)=>{
  if(!req.user?.isAdmin) return res.status(403).send('Forbidden')
  const { id } = req.params
  const { status } = req.body||{}
  if(!['pending','accepted','delivered'].includes(status)) return res.status(400).send('Invalid status')
  const doc = await Order.findByIdAndUpdate(id, { status }, { new: true })
  if(!doc) return res.status(404).send('Not found')
  res.json({ id: doc._id, status: doc.status })
})

// ========== RETURNS ==========
app.post('/api/returns', async (req,res)=>{
  const b=req.body||{}
  if(!b.orderId||!b.email) return res.status(400).send('Missing fields')
  const r = await ReturnRequest.create(b)
  // emails
  try { await sendMail(b.email, 'Your return request has been received', wrapEmail(`<p>We have received your return/cancel request for order <b>${b.orderId}</b>.</p><p>We will review and update you shortly.</p>`)) } catch {}
  try { await sendMail(STORE_EMAIL, 'New return request', wrapEmail(`<p>Return request for order <b>${b.orderId}</b> from ${b.email}.</p><p>Reasons: ${(b.reasons||[]).join(', ')}</p>`)) } catch {}
  res.json({ id: r._id })
})

// Mongo connection
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.warn('MONGODB_URI missing. API will start without a database connection.')
} else {
  mongoose.connect(MONGODB_URI).then(()=>console.log('Mongo connected')).catch((err)=>{ console.error('Mongo connection error:', err); process.exit(1) })
}

const PORT = Number(process.env.PORT || 5000)
app.listen(PORT, () => console.log(`API ready on :${PORT}${MONGODB_URI ? '' : ' (no DB)'}`))
