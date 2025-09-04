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

      // 텍스트 처리 전략: 매우 보수적으로 접근
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      
      let blocks;
      
      // 방법 1: 전체 내용을 하나의 블록으로 처리 (가장 안전)
      if (lines.length > 20) {
        // 긴 대화는 전체를 하나의 블록으로 합침
        const allContent = lines.join('\n');
        // 안전하게 1800자로 제한 (여유분 확보)
        const truncatedContent = allContent.length > 1800 ? allContent.substring(0, 1800) + '...\n\n(내용이 길어 일부만 표시됩니다)' : allContent;
        
        blocks = [{
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [{
              type: 'text' as const,
              text: { content: truncatedContent },
            }],
          },
        }];
      } else {
        // 짧은 대화만 각 줄을 개별 블록으로 처리
        blocks = lines.slice(0, 20).map(line => ({
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [{
              type: 'text' as const,
              text: { content: line.length > 1800 ? line.substring(0, 1800) + '...' : line },
            }],
          },
        }));
      }

      // 페이지 생성 (절대적으로 안전한 블록 수 보장)
      const finalBlocks = blocks.slice(0, 50); // 더 보수적으로 50개로 제한
      
      // 디버깅용 로그
      console.log(`Processing file: ${title}`);
      console.log(`Total lines: ${lines.length}`);
      console.log(`Final blocks count: ${finalBlocks.length}`);
      
      if (finalBlocks.length === 0) {
        // 빈 파일인 경우 기본 메시지 추가
        finalBlocks.push({
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [{
              type: 'text' as const,
              text: { content: '이 날에는 메시지가 없습니다.' },
            }],
          },
        });
      }
      
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
        children: finalBlocks,
      });
    }

    res.status(200).json({ message: '노션에 성공적으로 등록되었습니다' });
  } catch (error) {
    console.error('Error registering to Notion:', error);
    res.status(500).json({ error: '노션 등록 중 오류가 발생했습니다' });
  }
}