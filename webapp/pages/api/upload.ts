import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const form = formidable({});

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parser = fs.createReadStream(file.filepath).pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    }));

    const records: any[] = [];
    parser.on('readable', function(){
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('end', () => {
      console.log('Total records parsed:', records.length);
      if (records.length > 0) {
        console.log('First record sample:', records[0]);
        console.log('Column names:', Object.keys(records[0]));
      }

      // 카카오톡 CSV 파일의 다양한 컬럼명 형식을 지원
      const detectColumns = (record: any) => {
        const keys = Object.keys(record);
        
        // 날짜 컬럼 찾기
        const dateCol = keys.find(key => 
          key.toLowerCase().includes('date') || 
          key.includes('날짜') || 
          key.includes('Date') ||
          key.includes('시간') ||
          key.includes('Time')
        );
        
        // 사용자 컬럼 찾기
        const userCol = keys.find(key => 
          key.toLowerCase().includes('user') || 
          key.includes('이름') || 
          key.includes('User') ||
          key.includes('Name') ||
          key.includes('닉네임')
        );
        
        // 메시지 컬럼 찾기
        const messageCol = keys.find(key => 
          key.toLowerCase().includes('message') || 
          key.includes('대화') || 
          key.includes('Message') ||
          key.includes('내용') ||
          key.includes('메시지')
        );

        return { dateCol, userCol, messageCol };
      };

      if (records.length === 0) {
        return res.status(400).json({ error: 'No valid records found in CSV file' });
      }

      const { dateCol, userCol, messageCol } = detectColumns(records[0]);
      console.log('Detected columns:', { dateCol, userCol, messageCol });

      if (!dateCol) {
        return res.status(400).json({ 
          error: 'Date column not found. Expected columns: Date, 날짜, Time, or 시간' 
        });
      }

      const groupedByDate = records.reduce((acc, record) => {
        if (record && record[dateCol]) {
          let dateValue = record[dateCol];
          
          // 날짜 형식 파싱 (다양한 형식 지원)
          let date: string;
          if (typeof dateValue === 'string') {
            // YYYY-MM-DD HH:MM:SS 형식이나 다른 형식에서 날짜 부분만 추출
            const dateMatch = dateValue.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (dateMatch) {
              const [, year, month, day] = dateMatch;
              date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              // 다른 형식 시도 (YYYY.MM.DD, YYYY/MM/DD 등)
              const altDateMatch = dateValue.match(/(\d{4})[.\\/](\d{1,2})[.\\/](\d{1,2})/);
              if (altDateMatch) {
                const [, year, month, day] = altDateMatch;
                date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else {
                console.warn('Unknown date format:', dateValue);
                return acc;
              }
            }
          } else {
            console.warn('Invalid date value:', dateValue);
            return acc;
          }

          if (!acc[date]) {
            acc[date] = [];
          }
          
          const processedRecord = {
            date: date,
            user: userCol ? record[userCol] : 'Unknown',
            message: messageCol ? record[messageCol] : record[dateCol],
            time: record[dateCol]
          };
          
          acc[date].push(processedRecord);
        }
        return acc;
      }, {} as Record<string, any[]>);

      console.log('Grouped dates:', Object.keys(groupedByDate));

      const outputDir = path.join(process.cwd(), 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let filesCreated = 0;
      for (const date in groupedByDate) {
        const recordsForDate = groupedByDate[date];
        const filePath = path.join(outputDir, `${date}.md`);
        let fileContent = `# ${date}\n\n`;
        
        recordsForDate.forEach((record: any) => {
          const timeStr = record.time ? ` (${record.time})` : '';
          fileContent += `**${record.user}**${timeStr}: ${record.message}\n\n`;
        });
        
        fs.writeFileSync(filePath, fileContent);
        filesCreated++;
        console.log(`Created file: ${filePath}`);
      }

      if (filesCreated === 0) {
        return res.status(400).json({ error: 'No files were created. Please check your CSV format.' });
      }

      res.status(200).json({ 
        message: `CSV processed successfully. ${filesCreated} files created for dates: ${Object.keys(groupedByDate).join(', ')}` 
      });
    });

    parser.on('error', function(err){
      console.error('CSV parsing error:', err.message);
      res.status(500).json({ error: `Error parsing CSV: ${err.message}` });
    });
  });
}