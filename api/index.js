import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('../server/index.js');

// Vercel Serverless Function Handler
export default function handler(req, res) {
  return app(req, res);
}
