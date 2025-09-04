import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack 설정 (개발 모드에서만)
  turbopack: {},
  
  // 파일 추적 루트 설정
  outputFileTracingRoot: __dirname,
  
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 정적 파일 생성 강제
  trailingSlash: false,
};

export default nextConfig;
