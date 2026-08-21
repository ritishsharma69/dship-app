// Updates existing Advit products in MongoDB with YouTube URLs and testimonials.
// - Reads server/scripts/advit-extras.json (keyed by SKU)
// - For each SKU found in 'products' collection, $set youtubeUrl + testimonials
// - Idempotent: re-running just overwrites the same fields
// Usage: node server/scripts/update-advit-extras.js

require('dotenv').config({ path: __dirname + '/../.env' })
const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || 'dship'

if (!MONGODB_URI) { console.error('Missing MONGODB_URI in .env'); process.exit(1) }

function sanitizeString(v, max) {
  if (v == null) return ''
  const s = String(v).trim()
  return s.length > max ? s.slice(0, max) : s
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

async function main() {
  const extrasPath = path.join(__dirname, 'advit-extras.json')
  const extras = JSON.parse(fs.readFileSync(extrasPath, 'utf8'))
  const skus = Object.keys(extras)
  console.log(`Loaded ${skus.length} SKU entries from advit-extras.json`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)
  const col = db.collection('products')

  let updated = 0
  let notFound = 0
  let unchanged = 0

  for (const sku of skus) {
    const extra = extras[sku] || {}
    const youtubeUrl = sanitizeString(extra.youtubeUrl, 2000)
    const testimonials = sanitizeTestimonials(extra.testimonials)

    const doc = await col.findOne({ sku }, { projection: { _id: 1, title: 1 } })
    if (!doc) {
      console.log(`  ⚠️  SKU not found, skipping: ${sku}`)
      notFound++
      continue
    }

    const $set = { youtubeUrl, testimonials, updatedAt: new Date() }
    const result = await col.updateOne({ _id: doc._id }, { $set })
    if (result.modifiedCount === 1) {
      console.log(`  ✅ ${sku}  →  ${doc.title}  (yt: ${youtubeUrl ? 'yes' : '—'}, testimonials: ${testimonials.length})`)
      updated++
    } else {
      console.log(`  ↪︎ ${sku} already up-to-date`)
      unchanged++
    }
  }

  console.log('\n──── Summary ────')
  console.log(`Updated:   ${updated}`)
  console.log(`Unchanged: ${unchanged}`)
  console.log(`Not found: ${notFound}`)

  await client.close()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
