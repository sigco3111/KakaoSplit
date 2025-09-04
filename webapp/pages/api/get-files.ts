
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { outputPath = '/tmp/kakao-notion-output' } = req.query;
  
  // 절대경로인지 확인, 아니면 프로젝트 루트 기준으로 처리
  const isAbsolute = path.isAbsolute(outputPath as string);
  let outputDir: string;
  
  if (isAbsolute) {
    outputDir = outputPath as string;
  } else {
    outputDir = path.join(process.cwd(), outputPath as string);
  }
  
  try {
    if (!fs.existsSync(outputDir)) {
      // 권한 문제로 폴더가 없을 경우 대안 경로 확인
      const fallbackDir = path.join(process.cwd(), 'output');
      if (fs.existsSync(fallbackDir)) {
        outputDir = fallbackDir;
      } else {
        return res.status(200).json({ files: [] });
      }
    }
    
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.md'));
    res.status(200).json({ files });
  } catch (error: any) {
    console.error('파일 목록 조회 실패:', error);
    // 권한 에러 시 대안 경로에서 파일 조회
    try {
      const fallbackDir = path.join(process.cwd(), 'output');
      if (fs.existsSync(fallbackDir)) {
        const files = fs.readdirSync(fallbackDir).filter(file => file.endsWith('.md'));
        res.status(200).json({ files });
      } else {
        res.status(200).json({ files: [] });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: 'Could not read output directory' });
    }
  }
}
