import app from '../server/index.js';

// Vercel Serverless Function Handler
export default function handler(req, res) {
  return app(req, res);
}
