import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포를 위한 설정
  output: 'standalone',
  // Turbopack 설정 (개발 모드에서만)
  turbopack: {},
  // 파일 추적 루트 설정으로 경고 제거
  outputFileTracingRoot: undefined,
  // ESLint 설정
  eslint: {
    // 빌드 시 ESLint 경고를 무시 (배포용)
    ignoreDuringBuilds: true,
  },
  // TypeScript 설정
  typescript: {
    // 빌드 시 TypeScript 에러를 무시 (배포용)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
