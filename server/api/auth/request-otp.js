// Explicit function for /api/auth/request-otp to ensure Vercel routes preflights and POST here
const serverless = require('serverless-http')
const app = require('../../index.js')
module.exports = serverless(app)

