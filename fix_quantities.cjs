// Fix all quantities to 0 in seedData.ts
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'src', 'db', 'seedData.ts')
let content = fs.readFileSync(filePath, 'utf8')
content = content.replace(/quantity: \d+/g, 'quantity: 0')
content = content.replace(/damagedQuantity: \d+/g, 'damagedQuantity: 0')
fs.writeFileSync(filePath, content, 'utf8')
console.log('Done - all quantities set to 0')
