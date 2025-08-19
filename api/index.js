import app from '../server/index.js'

// Vercel uses the filename as the function. Export the express handler directly (ESM).
export default function handler(req, res) { return app(req, res) }

