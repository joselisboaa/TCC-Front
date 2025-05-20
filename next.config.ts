import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
};

const isTest = process.env.NEXT_PUBLIC_BACKEND_URL?.includes('8001');

module.exports = {
  distDir: isTest ? '.next_test' : '.next',
};


export default nextConfig;
