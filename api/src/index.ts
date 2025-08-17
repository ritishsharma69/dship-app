import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
// Optional mailer (OTP emails)
import nodemailer from 'nodemailer'
function getMailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env as any
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  try {
    const port = Number((process.env as any).SMTP_PORT || 587)
    const secure = String((process.env as any).SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    return nodemailer.createTransport({ host: SMTP_HOST as string, port, secure, auth: { user: SMTP_USER as string, pass: SMTP_PASS as string } })
  } catch {
    return null
  }
}
async function sendOtpEmail({ to, code }: { to: string; code: string }) {
  const transporter = getMailer()
  if (!transporter) return false
  const from = ((process.env as any).FROM_EMAIL) || ((process.env as any).SMTP_USER)
  const store = ((process.env as any).STORE_NAME) || 'KhushiyanaStore'
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
      <h2 style="margin:0 0 8px">${store}: Your OTP Code</h2>
      <p>Use the following code to verify your email:</p>
      <div style="font-size:28px; letter-spacing: 6px; font-weight: 800; background:#f8fafc; border:1px solid #e5e7eb; padding:12px 16px; display:inline-block; border-radius:10px;">${code}</div>
      <p style="color:#6b7280; font-size:12px; margin-top:10px;">This code will expire in 5 minutes. Do not share this code with anyone.</p>
    </div>`
  const text = `Your OTP code is: ${code}. It expires in 5 minutes.`
  try {
    await transporter.sendMail({ from, to, subject: `${store}: Your OTP Code`, html, text })
    return true
  } catch {
    return false
  }
}

const app = express()
app.use(express.json())

const CORS_ORIGIN = (process.env.CORS_ORIGIN as any) || ['http://localhost:5173','http://localhost:5174','http://localhost:5175']
app.use(cors({ origin: CORS_ORIGIN }))

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// Decide backend mode
const MONGODB_URI = process.env.MONGODB_URI
const USE_MEMORY = !MONGODB_URI

if (USE_MEMORY) {
  console.warn('MONGODB_URI missing. Running API in memory mode (no database).')
} else {
  // Mongo connect
  mongoose
    .connect(MONGODB_URI!)
    .then(() => console.log('Mongo connected'))
    .catch((err) => {
      console.error('Mongo connection error:', err)
      process.exit(1)
// Optional mailer (OTP emails)
import nodemailer from 'nodemailer'
function getMailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env as any
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  try {
    const port = Number((process.env as any).SMTP_PORT || 587)
    const secure = String((process.env as any).SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    return nodemailer.createTransport({ host: SMTP_HOST as string, port, secure, auth: { user: SMTP_USER as string, pass: SMTP_PASS as string } })
  } catch {
    return null
  }
}
async function sendOtpEmail({ to, code }: { to: string; code: string }) {
  const transporter = getMailer()
  if (!transporter) return false
  const from = ((process.env as any).FROM_EMAIL) || ((process.env as any).SMTP_USER)
  const store = ((process.env as any).STORE_NAME) || 'KhushiyanaStore'
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
      <h2 style="margin:0 0 8px">${store}: Your OTP Code</h2>
      <p>Use the following code to verify your email:</p>
      <div style="font-size:28px; letter-spacing: 6px; font-weight: 800; background:#f8fafc; border:1px solid #e5e7eb; padding:12px 16px; display:inline-block; border-radius:10px;">${code}</div>
      <p style="color:#6b7280; font-size:12px; margin-top:10px;">This code will expire in 5 minutes. Do not share this code with anyone.</p>
    </div>`
  const text = `Your OTP code is: ${code}. It expires in 5 minutes.`
  try {
    await transporter.sendMail({ from, to, subject: `${store}: Your OTP Code`, html, text })
    return true
  } catch {
    return false
  }
}

    })
}

// Product model / types
interface IProduct {
  title: string
  description?: string
  descriptionHeading?: string
  descriptionPoints?: string[]
  brand?: string
  price: number
  compareAtPrice?: number
  images: string[]
  bullets: string[]
  sku: string
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

const productSchema = new mongoose.Schema<IProduct>({
  title: { type: String, required: true },
  description: String,
  descriptionHeading: String,
  descriptionPoints: { type: [String], default: [] },
  brand: String,
  price: { type: Number, required: true },
  compareAtPrice: Number,
  images: { type: [String], default: [] },
  bullets: { type: [String], default: [] },
  sku: { type: String, required: true },
  inventoryStatus: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'], default: 'IN_STOCK' }
}, { timestamps: true })

const Product = mongoose.model<IProduct>('Product', productSchema)

type MemProduct = IProduct & { id: string }
const memStore: MemProduct[] = []
const genId = () => Math.random().toString(36).slice(2, 10)

// Seed route (dev only)
app.post('/api/seed', async (_req, res) => {
  if (USE_MEMORY) {
    if (memStore.length > 0) return res.json({ seeded: false, message: 'Already seeded' })
    const doc: MemProduct = {
      id: genId(),
      title: 'Adivasi Neelambari Herbal Hair Oil (200ml)',
      descriptionHeading: 'Made with Natural Herbs — Adivasi Hair Oil is prepared with pure herbal ingredients that strengthen and nourish hair.',
      descriptionPoints: [
        'Reduces Hair Fall — Its Ayurvedic components help minimize hair loss effectively.',
        'Removes Dandruff — Contains anti‑fungal properties that eliminate scalp dandruff.'
      ],
      brand: 'Bio Health India',
      price: 699,
      compareAtPrice: 1299,
      images: [
        '/products/adivasi/adivasi-1.png',
        '/products/adivasi/adivasi-2.png',
        '/products/adivasi/adivasi-3.png',
        '/products/adivasi/adivasi-4.png'
      ],
      bullets: [
        'Reduces hair fall and breakage',
        'Promotes new hair growth',
        'Herbal formulation with natural oils',
        'Deep scalp nourishment',
        'Suitable for all hair types'
      ],
      sku: 'ADIVASI-200ML',
      inventoryStatus: 'IN_STOCK'
    }
    memStore.push(doc)
    return res.json({ seeded: true, id: doc.id })
  }

  const count = await Product.countDocuments()
  if (count > 0) return res.json({ seeded: false, message: 'Already seeded' })

  const doc = await Product.create({
    title: 'Adivasi Neelambari Herbal Hair Oil (200ml)',
    descriptionHeading: 'Made with Natural Herbs — Adivasi Hair Oil is prepared with pure herbal ingredients that strengthen and nourish hair.',
    descriptionPoints: [
      'Reduces Hair Fall — Its Ayurvedic components help minimize hair loss effectively.',
      'Removes Dandruff — Contains anti‑fungal properties that eliminate scalp dandruff.'
    ],
    brand: 'Bio Health India',
    price: 699,
    compareAtPrice: 1299,
    images: [
      '/products/adivasi/adivasi-1.png',
      '/products/adivasi/adivasi-2.png',
      '/products/adivasi/adivasi-3.png',
      '/products/adivasi/adivasi-4.png'
    ],
    bullets: [
      'Reduces hair fall and breakage',
      'Promotes new hair growth',
      'Herbal formulation with natural oilssssss',
      'Deep scalp nourishment',
      'Suitable for all hair types'
    ],
    sku: 'ADIVASI-200ML',
    inventoryStatus: 'IN_STOCK'
  })

  res.json({ seeded: true, id: (doc as any)._id })
})

// API routes
function mapId<T extends { _id?: any }>(doc: T) {
  if (!doc) return doc as any
  const { _id, ...rest } = doc as any
  return { id: _id?.toString?.() ?? _id, ...rest }
}

app.get('/api/products', async (_req, res) => {
  if (USE_MEMORY) {
    return res.json(memStore)
  }
  const list = await Product.find().lean()
  res.json(list.map(mapId))
})

app.get('/api/products/:id', async (req, res) => {
  if (USE_MEMORY) {
    const item = memStore.find(p => p.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.json(item)
  }
  const item = await Product.findById(req.params.id).lean()
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(mapId(item))
})

// ---- OTP endpoints with optional email sending ----
const otpCache: Map<string, { code: string; expires: number }> = new Map()
app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
  try {
    const email = String((req.body as any)?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' })
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    otpCache.set(email, { code, expires: Date.now() + 5 * 60 * 1000 })

    // Try sending email if SMTP is configured; otherwise log to console in dev
    const sent = await sendOtpEmail({ to: email, code })
    if (!sent) console.warn('[mail] transporter not configured. OTP:', code)

    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/request-otp error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const email = String((req.body as any)?.email || '').trim().toLowerCase()
    const code = String((req.body as any)?.code || '').trim()
    const rec = otpCache.get(email)
    if (!rec || rec.code !== code || rec.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired code' })
    otpCache.delete(email)
    const token = Buffer.from(`${email}|${Date.now()}`).toString('base64')
    res.json({ token, email })
  } catch (err) {
    console.error('POST /api/auth/verify-otp error', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Orders
interface IOrderItem { productId: string; quantity: number; unitPrice: number }
interface IAddress { country?: string; line1: string; line2?: string; city: string; state: string; zip: string }
interface IOrder { email?: string; name: string; phone?: string; address: IAddress; items: IOrderItem[]; totals: { subtotal: number; shipping: number; tax: number; total: number } }

const orderSchema = new mongoose.Schema<IOrder>({
  email: String,
  name: { type: String, required: true },
  phone: String,
  address: { country: String, line1: String, line2: String, city: String, state: String, zip: String },
  items: [{ productId: String, quantity: Number, unitPrice: Number }],
  totals: { subtotal: Number, shipping: Number, tax: Number, total: Number }
}, { timestamps: true })

const Order = mongoose.model<IOrder>('Order', orderSchema)

// In-memory orders if USE_MEMORY
const memOrders: any[] = []

app.post('/api/orders', async (req: Request, res: Response) => {
  const body = req.body as IOrder
  // very light validation
  if (!body?.name || !body?.address?.line1 || !Array.isArray(body?.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'Invalid order' })
  }
  try {
    if (USE_MEMORY) {
      const id = genId()
      const doc = { id, ...body, createdAt: new Date().toISOString() }
      memOrders.push(doc)
      return res.json({ id, ok: true })
    }
    const created = await Order.create(body)
    // @ts-ignore
    return res.json({ id: created._id?.toString?.() || created.id, ok: true })
  } catch (e) {
    console.error('Order create error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
})


// Update product
app.put('/api/products/:id', async (req: express.Request, res: express.Response) => {
  const body = req.body as Partial<IProduct>
  const allowed = {
    title: body.title,
    description: body.description,
    descriptionHeading: body.descriptionHeading,
    descriptionPoints: body.descriptionPoints,
    brand: body.brand,
    price: body.price,
    compareAtPrice: body.compareAtPrice,
    images: body.images,
    bullets: body.bullets,
    sku: body.sku,
    inventoryStatus: body.inventoryStatus,
  }
  // Remove undefined keys to avoid accidentally clearing fields
  const update = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined))

  if (USE_MEMORY) {
    const idx = memStore.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Product not found' })
    memStore[idx] = { ...memStore[idx], ...(update as Partial<MemProduct>) }
    return res.json(memStore[idx])
  }

  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  ).lean()

  if (!updated) return res.status(404).json({ error: 'Product not found' })
  res.json(mapId(updated))
})

const PORT = Number(process.env.PORT || 5000)
app.listen(PORT, () => console.log(`API ready on :${PORT}${USE_MEMORY ? ' (memory mode)' : ''}`))

