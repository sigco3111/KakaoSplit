import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileName, content } = await request.json();

    if (!fileName || !content) {
      return NextResponse.json({ error: '파일명과 내용이 필요합니다.' }, { status: 400 });
    }

    // 파일 내용을 Blob으로 변환하여 다운로드 가능한 형태로 반환
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return new NextResponse(content, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: `파일 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, { status: 500 });
  }
}
