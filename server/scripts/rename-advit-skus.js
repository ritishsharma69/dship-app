// Renames Advit SKUs to Khushiyan Store naming convention (descriptive UPPERCASE-WITH-HYPHENS).
// Matches the style of existing SKUs: RECHARGABLE-HAND-JUICER, CRYSTAL-DIAMOND-TABLE-LAMP, etc.
// Idempotent: skips if SKU is already renamed or target SKU collides.
// Usage: node server/scripts/rename-advit-skus.js

require('dotenv').config({ path: __dirname + '/../.env' })
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || 'dship'
if (!MONGODB_URI) { console.error('Missing MONGODB_URI in .env'); process.exit(1) }

const RENAMES = [
  { from: 'ADV-MBS-001',   to: 'MINI-BOOST-SPEAKER' },
  { from: 'ADV-CBN-002',   to: 'CRYSTAL-BALL-LAMP' },
  { from: 'ADV-ASP-003',   to: 'ASTRONAUT-GALAXY-PROJECTOR' },
  { from: 'ADV-PNF-004',   to: 'BLADELESS-NECK-FAN' },
  { from: 'ADV-JSR-005',   to: 'JADE-FACE-ROLLER' },
  { from: 'ADV-PEJ-006',   to: 'PORTABLE-USB-JUICER' },
  { from: 'ADV-DCT-007',   to: 'DANCING-CACTUS-REPEAT' },
  { from: 'ADV-BFM-008',   to: 'EMS-BUTTERFLY-MASSAGER' },
  { from: 'ADV-SSM-009',   to: 'ELECTRIC-SCALP-MASSAGER' },
  { from: 'ADV-3DF-010',   to: 'CHROME-FACE-ROLLER' },
  { from: 'ADV-MOON-011',  to: 'MOON-TABLE-LAMP' },
  { from: 'ADV-MAC-012',   to: 'MINI-AIR-COOLER' },
  { from: 'ADV-AROMA-013', to: 'AROMA-DIFFUSER' },
  { from: 'ADV-RAM-014',   to: 'RAM-LALA-IDOL' },
  { from: 'ADV-AST-015',   to: 'ASTRONAUT-RGB-SPEAKER' },
  { from: 'ADV-SCAF-016',  to: 'SOLAR-CAR-FRESHENER' },
  { from: 'ADV-MSL-017',   to: 'MOTION-SENSOR-LIGHT' },
  { from: 'ADV-FSB-018',   to: 'FOLDABLE-WATER-BOTTLE' },
  { from: 'ADV-BUNNY-019', to: 'BUNNY-NIGHT-LIGHT' },
  { from: 'ADV-LDL-020',   to: 'LED-DESK-LAMP' },
]

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const col = client.db(DB_NAME).collection('products')

  let renamed = 0
  let alreadyDone = 0
  let collisions = 0
  let notFound = 0

  for (const { from, to } of RENAMES) {
    const source = await col.findOne({ sku: from }, { projection: { _id: 1, title: 1 } })
    const targetExists = await col.findOne({ sku: to }, { projection: { _id: 1 } })

    if (!source) {
      // Maybe already renamed — check if target exists instead
      if (targetExists) {
        console.log(`  ↪︎ ${from} → ${to}  already renamed`)
        alreadyDone++
      } else {
        console.log(`  ⚠️  ${from}  not found in DB, skipping`)
        notFound++
      }
      continue
    }

    if (targetExists && String(targetExists._id) !== String(source._id)) {
      console.log(`  ❌ ${from} → ${to}  COLLISION (target SKU already used by another product), skipping`)
      collisions++
      continue
    }

    await col.updateOne(
      { _id: source._id },
      { $set: { sku: to, updatedAt: new Date() } }
    )
    console.log(`  ✅ ${from.padEnd(16)} → ${to.padEnd(28)}  (${source.title})`)
    renamed++
  }

  console.log('\n──── Summary ────')
  console.log(`Renamed:        ${renamed}`)
  console.log(`Already renamed: ${alreadyDone}`)
  console.log(`Collisions:     ${collisions}`)
  console.log(`Not found:      ${notFound}`)

  await client.close()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
