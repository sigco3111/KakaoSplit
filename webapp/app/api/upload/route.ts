import { NextRequest, NextResponse } from 'next/server';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

// 요청을 Node.js IncomingMessage로 변환하는 헬퍼 함수
async function parseFormData(request: NextRequest) {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    
    // NextRequest를 Node.js 스트림으로 변환
    const chunks: Buffer[] = [];
    const reader = request.body?.getReader();
    
    if (!reader) {
      reject(new Error('No body found'));
      return;
    }
    
    const pump = () => {
      reader.read().then(({ done, value }) => {
        if (done) {
          const buffer = Buffer.concat(chunks);
          const boundary = request.headers.get('content-type')?.match(/boundary=(.+)$/)?.[1];
          
          if (boundary) {
            // FormData 파싱 로직 구현
            resolve({ files: {}, fields: {} });
          } else {
            reject(new Error('No boundary found'));
          }
        } else {
          chunks.push(Buffer.from(value));
          pump();
        }
      });
    };
    
    pump();
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const outputPath = (formData.get('outputPath') as string) || 'output';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 임시 파일 경로 생성
    const tempFilePath = path.join(process.cwd(), 'tmp', `upload_${Date.now()}.csv`);
    
    // 임시 디렉토리 생성
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 파일을 임시 위치에 저장
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // CSV 파싱
    const records: any[] = [];
    
    return new Promise((resolve) => {
      const parser = fs.createReadStream(tempFilePath).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
      }));

      parser.on('readable', function(){
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('end', () => {
        console.log('Total records parsed:', records.length);
        
        // 첫 번째 레코드 확인
        if (records.length > 0) {
          console.log('First record sample:', records[0]);
        }

        // 컬럼명 분석
        const columnNames = records.length > 0 ? Object.keys(records[0]) : [];
        console.log('Column names:', columnNames);

        // 날짜, 사용자, 메시지 컬럼 자동 감지
        let dateCol = '';
        let userCol = '';
        let messageCol = '';

        for (const col of columnNames) {
          const lowerCol = col.toLowerCase();
          if (lowerCol.includes('date') || lowerCol.includes('time') || lowerCol.includes('날짜') || lowerCol.includes('시간')) {
            dateCol = col;
          }
          if (lowerCol.includes('user') || lowerCol.includes('name') || lowerCol.includes('사용자') || lowerCol.includes('이름')) {
            userCol = col;
          }
          if (lowerCol.includes('message') || lowerCol.includes('text') || lowerCol.includes('content') || lowerCol.includes('메시지') || lowerCol.includes('내용')) {
            messageCol = col;
          }
        }

        console.log('Detected columns:', { dateCol, userCol, messageCol });

        if (!dateCol || !userCol || !messageCol) {
          // 임시 파일 삭제
          fs.unlinkSync(tempFilePath);
          resolve(NextResponse.json({ error: 'Required columns not found. Please ensure your CSV has date, user, and message columns.' }, { status: 400 }));
          return;
        }

        // 날짜별로 그룹핑
        const groupedByDate: { [key: string]: any[] } = {};

        records.forEach(record => {
          const dateValue = record[dateCol];
          let dateKey = '';

          try {
            // 다양한 날짜 형식 지원
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              dateKey = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
            } else {
              // 직접 파싱 시도
              const dateMatch = dateValue.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (dateMatch) {
                dateKey = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
              } else {
                console.warn('Unable to parse date:', dateValue);
                dateKey = 'unknown-date';
              }
            }
          } catch (error) {
            console.warn('Date parsing error:', error);
            dateKey = 'unknown-date';
          }

          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(record);
        });

        console.log('Grouped dates:', Object.keys(groupedByDate));

        // 절대경로인지 확인
        const isAbsolute = path.isAbsolute(outputPath);
        let outputDir: string;
        
        if (isAbsolute) {
          outputDir = outputPath;
        } else {
          outputDir = path.join(process.cwd(), outputPath);
        }

        // 출력 디렉토리 생성 시도, 실패하면 안전한 경로 사용
        try {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
        } catch (error: any) {
          console.warn('Failed to create output directory:', error.message);
          // 권한 문제가 있을 경우 /tmp 디렉토리 사용
          outputDir = '/tmp/kakao-notion-output';
          try {
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
          } catch (fallbackError: any) {
            console.error('Failed to create fallback directory:', fallbackError.message);
            // 임시 파일 삭제
            fs.unlinkSync(tempFilePath);
            resolve(NextResponse.json({ error: 'Unable to create output directory' }, { status: 500 }));
            return;
          }
        }

        // 각 날짜별로 파일 생성
        const createdFiles = [];
        for (const dateKey in groupedByDate) {
          const messages = groupedByDate[dateKey];
          const filename = `${dateKey}.md`;
          const filepath = path.join(outputDir, filename);

          let content = `# ${dateKey} 카카오톡 대화\n\n`;
          messages.forEach((msg: any) => {
            const timestamp = msg[dateCol] || '';
            const user = msg[userCol] || '';
            const message = msg[messageCol] || '';
            content += `**${user}** (${timestamp})\n${message}\n\n`;
          });

          try {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`Created file: ${filepath}`);
            createdFiles.push(filename);
          } catch (writeError: any) {
            console.error(`Failed to write file ${filepath}:`, writeError.message);
          }
        }

        // 임시 파일 삭제
        fs.unlinkSync(tempFilePath);

        resolve(NextResponse.json({
          message: 'CSV processed successfully',
          files: createdFiles,
          outputPath: outputDir
        }));
      });

      parser.on('error', (error) => {
        console.error('CSV parsing error:', error);
        // 임시 파일 삭제
        fs.unlinkSync(tempFilePath);
        resolve(NextResponse.json({ error: 'Error parsing CSV file' }, { status: 500 }));
      });
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error processing upload' }, { status: 500 });
  }
}
