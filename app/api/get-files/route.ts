import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outputPath = searchParams.get('outputPath') || 'output';
    
    // 절대경로인지 확인, 아니면 프로젝트 루트 기준으로 처리
    const isAbsolute = path.isAbsolute(outputPath);
    let outputDir: string;
    
    if (isAbsolute) {
      outputDir = outputPath;
    } else {
      outputDir = path.join(process.cwd(), outputPath);
    }

    // 폴더 접근 권한 확인
    if (!fs.existsSync(outputDir)) {
      // 권한 문제로 폴더가 없을 경우 대안 경로 확인
      const fallbackDir = path.join(process.cwd(), 'output');
      if (fs.existsSync(fallbackDir)) {
        outputDir = fallbackDir;
      } else {
        return NextResponse.json({ files: [] });
      }
    }

    try {
      const files = fs.readdirSync(outputDir)
        .filter(file => file.endsWith('.md'))
        .sort();
      
      return NextResponse.json({ files, outputPath: outputDir });
    } catch (error: any) {
      console.warn('Failed to read directory:', error.message);
      return NextResponse.json({ files: [] });
    }
  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Error listing files' }, { status: 500 });
  }
}
