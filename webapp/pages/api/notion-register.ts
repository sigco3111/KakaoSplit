import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { notionToken, notionDbId, selectedFiles, outputPath = 'output' } = req.body;

  if (!notionToken || !notionDbId || !selectedFiles || !Array.isArray(selectedFiles)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const notion = new Client({ auth: notionToken });
  
  // 절대경로인지 확인, 아니면 프로젝트 루트 기준으로 처리
  const isAbsolute = path.isAbsolute(outputPath);
  let outputDir: string;
  
  if (isAbsolute) {
    outputDir = outputPath;
  } else {
    outputDir = path.join(process.cwd(), outputPath);
  }

  try {
    // 폴더 접근 권한 확인
    if (!fs.existsSync(outputDir)) {
      // 권한 문제로 폴더가 없을 경우 대안 경로 확인
      const fallbackDir = path.join(process.cwd(), 'output');
      if (fs.existsSync(fallbackDir)) {
        outputDir = fallbackDir;
      } else {
        return res.status(400).json({ error: '파일이 저장된 폴더를 찾을 수 없습니다.' });
      }
    }
    for (const file of selectedFiles) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = file.replace('.md', '');

      // Simple markdown to Notion blocks conversion (each line is a paragraph)
      const blocks = content.split('\n').map(line => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{
            type: 'text' as const,
            text: { content: line },
          }],
        },
      }));

      await notion.pages.create({
        parent: { database_id: notionDbId },
        properties: {
          title: {
            title: [
              {
                text: { content: title },
              },
            ],
          },
        },
        children: blocks,
      });
    }

    res.status(200).json({ message: '노션에 성공적으로 등록되었습니다' });
  } catch (error) {
    console.error('Error registering to Notion:', error);
    res.status(500).json({ error: '노션 등록 중 오류가 발생했습니다' });
  }
}