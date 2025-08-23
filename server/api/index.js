// Vercel serverless entry that reuses the Express app from ../index.js
// This allows deploying the server/ folder as a Vercel project with Root Directory = server

const app = require('../index.js')

// Export a handler function so Vercel Node runtime invokes Express correctly
module.exports = (req, res) => app(req, res)

