import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { notionToken, notionDbId, selectedFiles } = req.body;

  if (!notionToken || !notionDbId || !selectedFiles || !Array.isArray(selectedFiles)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const notion = new Client({ auth: notionToken });
  const outputDir = path.join(process.cwd(), 'output');

  try {
    for (const file of selectedFiles) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = file.replace('.md', '');

      // Simple markdown to Notion blocks conversion (each line is a paragraph)
      const blocks = content.split('\n').map(line => ({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
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

    res.status(200).json({ message: 'Successfully registered to Notion' });
  } catch (error) {
    console.error('Error registering to Notion:', error);
    res.status(500).json({ error: 'Error registering to Notion' });
  }
}