const express = require('express')
const crypto = require('crypto')
const https = require('https')

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

module.exports = (req, res) => app(req, res)

