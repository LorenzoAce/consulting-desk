import { createAuthClient } from '@neondatabase/neon-js/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.error("VITE_NEON_AUTH_URL is missing! Please check your .env file or Vercel environment variables.");
}

export const authClient = createAuthClient(authUrl || "https://placeholder-url-to-prevent-crash.com");
