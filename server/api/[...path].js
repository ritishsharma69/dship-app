// Vercel serverless function that forwards all requests to our Express app
const app = require('../index')

module.exports = (req, res) => {
  // Vercel provides req.url including the path under /api, our Express app is mounted at root
  return app(req, res)
}

