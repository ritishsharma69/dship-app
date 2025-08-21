// Explicit route wrapper for Vercel so OPTIONS/POST hit Express
const app = require('../../index')

module.exports = (req, res) => app(req, res)

