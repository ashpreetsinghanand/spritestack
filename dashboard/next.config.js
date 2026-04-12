const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Default to the monorepo root (one level up from dashboard/)
    SPRITESTACK_CWD: process.env.SPRITESTACK_CWD || path.resolve(__dirname, '..'),
  },
};

module.exports = nextConfig;
