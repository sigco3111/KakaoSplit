import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionToken, notionDbId } = body;

    if (!notionToken || !notionDbId) {
      return NextResponse.json({ 
        error: 'Notion 토큰과 데이터베이스 ID가 필요합니다.' 
      }, { status: 400 });
    }

    // 데이터베이스 ID 정리 (하이픈 제거 및 정규화)
    const cleanDbId = notionDbId.replace(/-/g, '');
    console.log(`Original DB ID: ${notionDbId}`);
    console.log(`Cleaned DB ID: ${cleanDbId}`);

    const notion = new Client({ auth: notionToken });

    try {
      // 데이터베이스 정보 조회 시도
      const database = await notion.databases.retrieve({
        database_id: cleanDbId,
      });

      return NextResponse.json({
        success: true,
        message: '✅ Notion 데이터베이스 연결 성공!',
        database: {
          id: database.id,
          title: (database as any).title?.[0]?.plain_text || '제목 없음',
          created_time: (database as any).created_time,
          last_edited_time: (database as any).last_edited_time,
          properties: Object.keys((database as any).properties || {}),
        },
      });
    } catch (notionError: any) {
      console.error('Notion API Error:', notionError);
      
      let errorMessage = '❌ Notion 연결 실패: ';
      
      if (notionError.code === 'object_not_found') {
        errorMessage += `
데이터베이스를 찾을 수 없습니다 (ID: ${notionDbId})

해결 방법:
1. 데이터베이스 ID가 정확한지 확인하세요
2. Notion에서 해당 데이터베이스 페이지로 이동
3. 페이지 우상단 "..." → "연결" → Integration 추가
4. 데이터베이스가 삭제되지 않았는지 확인하세요`;
      } else if (notionError.code === 'unauthorized') {
        errorMessage += `
API 토큰이 유효하지 않거나 권한이 부족합니다

해결 방법:
1. Notion API 토큰이 올바른지 확인하세요
2. Integration이 활성화되어 있는지 확인하세요
3. 새로운 토큰을 발급받아 시도해보세요`;
      } else {
        errorMessage += `알 수 없는 오류: ${notionError.message}`;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: notionError.code,
        details: notionError.message,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json({ 
      success: false,
      error: '연결 테스트 중 오류가 발생했습니다: ' + error.message 
    }, { status: 500 });
  }
}
