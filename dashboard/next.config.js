/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SPRITESTACK_CWD: process.env.SPRITESTACK_CWD || process.cwd(),
  },
};

module.exports = nextConfig;
