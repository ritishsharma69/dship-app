// Vercel catch-all API route to serve the Express app for all /api/* paths
// This ensures routes like /api/health, /api/orders, etc., are handled by Express

const app = require('../index.js')
// Export a handler function to be fully compatible with Vercel Node functions
module.exports = (req, res) => app(req, res)
