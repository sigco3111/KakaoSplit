
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const outputDir = path.join(process.cwd(), 'output');
  try {
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.md'));
    res.status(200).json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Could not read output directory' });
  }
}
