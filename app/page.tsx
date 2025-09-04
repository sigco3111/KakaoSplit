'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [outputFiles, setOutputFiles] = useState<string[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Array<{name: string, content: string, size: number}>>([]);
  const [recentChatOnly, setRecentChatOnly] = useState(false); // 최근 대화만 가져오기 옵션
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (processedFiles.length > 0) {
      setOutputFiles(processedFiles.map(f => f.name));
    }
  }, [processedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('업로드할 파일을 선택해주세요.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outputPath', '/tmp/kakao-split-output'); // 고정 경로 사용

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        
        // Vercel 환경에서는 파일 내용이 응답에 포함됨
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          // 새로운 응답 형식 처리 (파일 내용 포함)
          if (data.files[0].content !== undefined) {
            setProcessedFiles(data.files);
            setOutputFiles(data.files.map((f: any) => f.name));
          } else {
            // 기존 응답 형식 (파일명만)
            setOutputFiles(data.files);
          }
        }
        
        if (data.note) {
          setMessage(data.message + '\n\n' + data.note);
        }
      } else {
        setError(`오류: ${data.error}`);
      }
    } catch (error) {
      setError('파일 업로드 중 오류 발생');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  // 최근 대화만 가져오기 필터링 함수
  const getFilteredFiles = () => {
    if (!recentChatOnly || processedFiles.length === 0) {
      return processedFiles;
    }
    
    // 날짜순으로 정렬해서 가장 최근 날짜의 파일만 반환
    const sortedFiles = [...processedFiles].sort((a, b) => {
      const dateA = a.name.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      const dateB = b.name.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      return dateB.localeCompare(dateA);
    });
    
    if (sortedFiles.length === 0) return [];
    
    const mostRecentDate = sortedFiles[0].name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    return sortedFiles.filter(file => file.name.includes(mostRecentDate || ''));
  };

  const downloadFile = async (fileName: string) => {
    try {
      const fileData = processedFiles.find(f => f.name === fileName);
      if (!fileData) {
        setError('파일 데이터를 찾을 수 없습니다.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // 브라우저에서 직접 다운로드
      const blob = new Blob([fileData.content], { type: 'text/plain; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage(`${fileName} 파일이 다운로드되었습니다.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('파일 다운로드 중 오류가 발생했습니다.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const downloadAllFiles = async () => {
    setLoading(true);
    try {
      const filesToDownload = getFilteredFiles();
      
      if (filesToDownload.length === 0) {
        setError('다운로드할 파일이 없습니다.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const zip = new JSZip();
      
      filesToDownload.forEach(fileData => {
        zip.file(fileData.name, fileData.content);
      });

      const content = await zip.generateAsync({type: 'blob'});
      
      // ZIP 파일 다운로드
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      
      const zipFileName = recentChatOnly 
        ? `kakao-chat-recent-${new Date().toISOString().split('T')[0]}.zip`
        : `kakao-chat-all-${new Date().toISOString().split('T')[0]}.zip`;
      
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      const fileCount = filesToDownload.length;
      setMessage(`${fileCount}개 파일이 ZIP으로 다운로드되었습니다.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('ZIP 생성 오류:', error);
      setError('ZIP 파일 생성 중 오류가 발생했습니다.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-2">
          KakaoSplit
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          카카오톡 대화를 날짜별로 분리하여 파일로 저장
        </p>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">CSV 업로드</h2>
          <form onSubmit={handleUploadSubmit} className="flex flex-col items-center">
            <input type="file" onChange={handleFileChange} accept=".csv" className="mb-4" data-testid="file-input" />
            <button type="submit" className="rounded-full bg-blue-500 text-white px-6 py-2 font-semibold hover:bg-blue-600 transition-colors" disabled={loading}>
              {loading ? '업로드 중...' : 'CSV 업로드'}
            </button>
          </form>
        </div>

        <div className="w-full max-w-md mt-8">
          <h2 className="text-2xl font-semibold mb-4">생성된 파일 목록</h2>
          
          {processedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 mb-2">
                🎉 CSV 파일 처리 완료! {processedFiles.length}개의 날짜별 파일이 생성되었습니다.
              </p>
              
              {/* 최근 대화만 가져오기 옵션 */}
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="recentOnly"
                  checked={recentChatOnly}
                  onChange={(e) => setRecentChatOnly(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="recentOnly" className="text-sm text-gray-700">
                  최근 대화만 가져오기
                </label>
              </div>
              
              <button
                onClick={downloadAllFiles}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'ZIP 생성 중...' : 
                  `${recentChatOnly ? '최근 대화' : '전체'} ZIP으로 다운로드 (${filteredFiles.length}개 파일)`}
              </button>
            </div>
          )}
          
          <div className="flex flex-col items-start space-y-2">
            {filteredFiles.map(file => (
              <div key={file.name} className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="text-sm">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({Math.round(file.size / 1024)}KB)
                  </span>
                </div>
                <button
                  onClick={() => downloadFile(file.name)}
                  className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  다운로드
                </button>
              </div>
            ))}
            
            {recentChatOnly && filteredFiles.length < processedFiles.length && (
              <p className="text-xs text-gray-500 mt-2">
                {processedFiles.length - filteredFiles.length}개의 이전 대화가 숨겨졌습니다. 
                "최근 대화만 가져오기"를 해제하면 모든 파일을 볼 수 있습니다.
              </p>
            )}
          </div>
        </div>

        {message && <p className="mt-4 text-green-600 whitespace-pre-line">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

      </main>
    </div>
  );
}
