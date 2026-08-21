// Seeds Advit Enterprise products into MongoDB.
// - Reads server/scripts/advit-products.json
// - Downloads each product image, uploads to Cloudinary (folder: dship/products)
// - Inserts into 'products' collection with hidden:true (admin-visible, customer-hidden)
// - Idempotent: skips if SKU already exists
// Usage: node server/scripts/seed-advit-products.js

require('dotenv').config({ path: __dirname + '/../.env' })
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || 'dship'
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!MONGODB_URI) { console.error('Missing MONGODB_URI in .env'); process.exit(1) }
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env')
  process.exit(1)
}

function cloudinarySign(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter(k => params[k] != null && params[k] !== '')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`Download failed: ${url} (HTTP ${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

async function uploadToCloudinary(imageBuffer, publicIdHint) {
  const folder = 'dship/products'
  const timestamp = Math.floor(Date.now() / 1000)
  const publicId = `${publicIdHint}-${timestamp}`
  const signature = cloudinarySign({ folder, public_id: publicId, timestamp }, API_SECRET)

  const form = new FormData()
  form.append('file', new Blob([imageBuffer]), 'image.jpg')
  form.append('api_key', API_KEY)
  form.append('timestamp', String(timestamp))
  form.append('folder', folder)
  form.append('public_id', publicId)
  form.append('signature', signature)

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const res = await fetch(url, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || !data.secure_url) {
    throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`)
  }
  return data.secure_url
}

async function main() {
  const productsPath = path.join(__dirname, 'advit-products.json')
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
  console.log(`[seed] Loaded ${products.length} products from advit-products.json`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)
  const coll = db.collection('products')

  let inserted = 0, skipped = 0, failed = 0
  for (const p of products) {
    try {
      const existing = await coll.findOne({ sku: p.sku }, { projection: { _id: 1 } })
      if (existing) {
        console.log(`[skip] ${p.sku} already exists`)
        skipped++
        continue
      }

      console.log(`[fetch] ${p.title} — downloading image...`)
      const buf = await downloadImage(p.sourceImage)
      console.log(`[upload] ${p.title} — uploading to Cloudinary...`)
      const cloudUrl = await uploadToCloudinary(buf, p.slug)

      const now = new Date()
      const doc = {
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand || 'Khushiyan',
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: [cloudUrl],
        heroImages: [cloudUrl],
        bullets: p.bullets || [],
        description: p.description || '',
        descriptionHeading: p.descriptionHeading || '',
        descriptionPoints: p.descriptionPoints || [],
        youtubeUrl: '',
        video: '',
        testimonials: [],
        ratingAvg: 4.5,
        ratingCount: 0,
        inventoryStatus: 'IN_STOCK',
        hidden: true,
        source: 'advit-enterprise',
        createdAt: now,
        updatedAt: now,
      }

      await coll.insertOne(doc)
      console.log(`[ok] inserted ${p.sku} → ${cloudUrl}`)
      inserted++
    } catch (err) {
      console.error(`[fail] ${p.sku}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n=== SEEDING COMPLETE ===`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Skipped (already exists): ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nAll products inserted with hidden:true.`)
  console.log(`Visit admin panel to review and toggle hidden:false to publish.`)

  await client.close()
}

main().catch(err => { console.error('[fatal]', err); process.exit(1) })
