// One-off sync: applies the same SKU rename map to the two source JSON files
// so future re-seeds stay consistent with the renamed DB.
// Usage: node server/scripts/sync-sku-rename-in-json.js

const fs = require('fs')
const path = require('path')

const MAP = {
  'ADV-MBS-001':   'MINI-BOOST-SPEAKER',
  'ADV-CBN-002':   'CRYSTAL-BALL-LAMP',
  'ADV-ASP-003':   'ASTRONAUT-GALAXY-PROJECTOR',
  'ADV-PNF-004':   'BLADELESS-NECK-FAN',
  'ADV-JSR-005':   'JADE-FACE-ROLLER',
  'ADV-PEJ-006':   'PORTABLE-USB-JUICER',
  'ADV-DCT-007':   'DANCING-CACTUS-REPEAT',
  'ADV-BFM-008':   'EMS-BUTTERFLY-MASSAGER',
  'ADV-SSM-009':   'ELECTRIC-SCALP-MASSAGER',
  'ADV-3DF-010':   'CHROME-FACE-ROLLER',
  'ADV-MOON-011':  'MOON-TABLE-LAMP',
  'ADV-MAC-012':   'MINI-AIR-COOLER',
  'ADV-AROMA-013': 'AROMA-DIFFUSER',
  'ADV-RAM-014':   'RAM-LALA-IDOL',
  'ADV-AST-015':   'ASTRONAUT-RGB-SPEAKER',
  'ADV-SCAF-016':  'SOLAR-CAR-FRESHENER',
  'ADV-MSL-017':   'MOTION-SENSOR-LIGHT',
  'ADV-FSB-018':   'FOLDABLE-WATER-BOTTLE',
  'ADV-BUNNY-019': 'BUNNY-NIGHT-LIGHT',
  'ADV-LDL-020':   'LED-DESK-LAMP',
}

const productsPath = path.join(__dirname, 'advit-products.json')
const extrasPath = path.join(__dirname, 'advit-extras.json')

// 1. advit-products.json (array of products with sku field)
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
let pUpdated = 0
for (const p of products) {
  if (MAP[p.sku]) {
    p.sku = MAP[p.sku]
    pUpdated++
  }
}
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n')
console.log(`advit-products.json:  ${pUpdated} SKUs updated`)

// 2. advit-extras.json (object keyed by sku)
const extras = JSON.parse(fs.readFileSync(extrasPath, 'utf8'))
const newExtras = {}
let eUpdated = 0
for (const key of Object.keys(extras)) {
  const newKey = MAP[key] || key
  if (MAP[key]) eUpdated++
  newExtras[newKey] = extras[key]
}
fs.writeFileSync(extrasPath, JSON.stringify(newExtras, null, 2) + '\n')
console.log(`advit-extras.json:    ${eUpdated} keys updated`)

console.log('\nDone. Both JSON files now use the new SKUs.')
