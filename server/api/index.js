// Vercel serverless entry that reuses the Express app from ../index.js
// This allows deploying the server/ folder as a Vercel project with Root Directory = server

const app = require('../index.js')

// Export the Express app as the handler
module.exports = app

