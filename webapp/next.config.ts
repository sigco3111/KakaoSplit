import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 외부 패키지 설정 (Next.js 15.5.2+)
  serverExternalPackages: ['formidable'],
  
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
