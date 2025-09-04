import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const outputPath = formData.get('outputPath') as string;

    if (!file) {
      return NextResponse.json({ error: '파일이 업로드되지 않았습니다.' }, { status: 400 });
    }

    if (!outputPath) {
      return NextResponse.json({ error: '출력 경로가 지정되지 않았습니다.' }, { status: 400 });
    }

    // 파일이 CSV인지 확인
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSV 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일 내용 읽기
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    
    console.log('CSV 파일 처음 500자:', text.substring(0, 500));
    console.log('CSV 파일 크기:', text.length);

    // CSV 파싱
    let records;
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        encoding: 'utf8'
      });
      console.log('파싱된 레코드 수:', records.length);
    } catch (parseError) {
      console.error('CSV 파싱 오류:', parseError);
      return NextResponse.json({ error: 'CSV 파일 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'CSV 파일에 데이터가 없습니다.' }, { status: 400 });
    }

    // Vercel 환경에서는 /tmp 디렉터리만 쓰기 가능
    // 사용자 입력 경로 대신 임시 디렉터리 사용
    const timestamp = Date.now();
    const outputDir = path.join('/tmp', `kakao-chat-${timestamp}`);
    
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (error) {
      console.error('디렉터리 생성 오류:', error);
      return NextResponse.json({ 
        error: '임시 디렉터리 생성에 실패했습니다.' 
      }, { status: 500 });
    }

    // 날짜별로 메시지 분류
    const messagesByDate: { [date: string]: any[] } = {};
    let currentDate: string | null = null; // 현재 처리 중인 날짜 추적

    records.forEach((record: any, index: number) => {
      // 첫 번째 레코드에서 실제 데이터 구조 확인
      if (index === 0) {
        console.log('첫 번째 레코드 전체:', record);
        console.log('사용 가능한 필드들:', Object.keys(record));
        Object.keys(record).forEach(key => {
          console.log(`${key}: "${record[key]}"`);
        });
      }

      // 일반적인 카카오톡 CSV 필드명들 (Date, Time, User, Message 등)
      const dateField = record.Date || record.날짜 || record.date;
      const timeField = record.Time || record.시간 || record.time;
      const userField = record.User || record.사용자 || record.user || record.User명;
      const messageField = record.Message || record.메시지 || record.message || record.내용;

      // 날짜 필드가 있으면 현재 날짜 업데이트
      if (dateField && dateField.trim()) {
        try {
          const date = new Date(dateField);
          if (isNaN(date.getTime())) {
            // 날짜 파싱이 실패한 경우 원본 문자열에서 날짜 추출 시도
            const dateMatch = dateField.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
              currentDate = dateMatch[0];
            } else {
              console.warn(`레코드 ${index}: 날짜 형식을 인식할 수 없습니다:`, dateField);
            }
          } else {
            currentDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn(`레코드 ${index}: 날짜 처리 중 오류:`, dateField, error);
        }
      }

      // 현재 날짜가 없으면 스킵 (첫 번째 유효한 날짜를 찾을 때까지)
      if (!currentDate) {
        if (index < 10) { // 처음 10개 레코드에서만 경고 출력
          console.warn(`레코드 ${index}: 현재 날짜가 설정되지 않았습니다. Date 필드 값: "${dateField}"`);
        }
        return;
      }

      // 현재 날짜로 메시지 분류
      if (!messagesByDate[currentDate]) {
        messagesByDate[currentDate] = [];
      }

      messagesByDate[currentDate].push({
        time: timeField || '',
        user: userField || '',
        message: messageField || ''
      });
    });

    // 각 날짜별로 파일 생성
    const createdFiles: Array<{name: string, content: string, path: string}> = [];
    const processedDates = Object.keys(messagesByDate);
    
    console.log(`처리된 날짜들: ${processedDates.join(', ')}`);
    console.log(`총 ${processedDates.length}개의 날짜, ${Object.values(messagesByDate).reduce((sum, msgs) => sum + msgs.length, 0)}개의 메시지`);
    
    for (const [date, messages] of Object.entries(messagesByDate)) {
      // 날짜가 포함된 파일명으로 생성
      const fileName = `chat_${date}.md`;
      const filePath = path.join(outputDir, fileName);
      
      const content = messages.map(msg => 
        `${msg.time} ${msg.user}: ${msg.message}`
      ).join('\n');

      try {
        fs.writeFileSync(filePath, content, 'utf-8');
        createdFiles.push({
          name: fileName,
          content: content,
          path: filePath
        });
        console.log(`생성된 파일: ${fileName} (${messages.length}개 메시지)`);
      } catch (error) {
        console.error(`파일 생성 오류 (${fileName}):`, error);
        // 파일 생성에 실패해도 계속 진행
      }
    }

    if (createdFiles.length === 0) {
      return NextResponse.json({ 
        error: 'CSV 파일에서 유효한 날짜와 메시지를 찾을 수 없습니다. 파일 형식을 확인해주세요.' 
      }, { status: 400 });
    }

    // Vercel 환경을 위해 파일 내용도 함께 반환
    return NextResponse.json({
      message: `CSV 파일이 성공적으로 처리되었습니다. ${createdFiles.length}개의 날짜별 파일이 생성되었습니다.`,
      files: createdFiles.map(f => ({
        name: f.name,
        content: f.content,
        size: f.content.length
      })),
      outputPath: outputDir,
      totalMessages: Object.values(messagesByDate).reduce((sum, msgs) => sum + msgs.length, 0),
      dateRange: processedDates.length > 0 ? `${processedDates[0]} ~ ${processedDates[processedDates.length - 1]}` : '',
      // Vercel 환경에서는 실제 파일 경로 대신 임시 경로 정보
      isTemporary: true,
      note: 'Vercel 환경에서는 파일이 임시 디렉터리에 생성됩니다.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: `파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}
