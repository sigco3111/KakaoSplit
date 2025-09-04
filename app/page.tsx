'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [notionDbId, setNotionDbId] = useState('');
  const [outputPath, setOutputPath] = useState('/tmp/kakao-notion-output'); // 기본값을 절대경로로 설정
  const [outputFiles, setOutputFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 간단한 경로 설정 헬퍼 함수들
  const setQuickPath = (pathType: 'tmp' | 'desktop' | 'downloads') => {
    const userAgent = navigator.userAgent.toLowerCase();
    let quickPath: string;
    
    switch (pathType) {
      case 'tmp':
        quickPath = userAgent.includes('windows') ? 'C:\\temp\\kakao-chats' : '/tmp/kakao-chats';
        break;
      case 'desktop':
        if (userAgent.includes('mac')) {
          quickPath = '/Users/' + (localStorage.getItem('username') || 'user') + '/Desktop/kakao-chats';
        } else if (userAgent.includes('windows')) {
          quickPath = 'C:\\Users\\' + (localStorage.getItem('username') || 'user') + '\\Desktop\\kakao-chats';
        } else {
          quickPath = '/home/' + (localStorage.getItem('username') || 'user') + '/Desktop/kakao-chats';
        }
        break;
      case 'downloads':
        if (userAgent.includes('mac')) {
          quickPath = '/Users/' + (localStorage.getItem('username') || 'user') + '/Downloads/kakao-chats';
        } else if (userAgent.includes('windows')) {
          quickPath = 'C:\\Users\\' + (localStorage.getItem('username') || 'user') + '\\Downloads\\kakao-chats';
        } else {
          quickPath = '/home/' + (localStorage.getItem('username') || 'user') + '/Downloads/kakao-chats';
        }
        break;
    }
    
    setOutputPath(quickPath);
    setMessage(`경로가 설정되었습니다: ${quickPath}`);
    setTimeout(() => setMessage(''), 3000);
  };
  const handleSelectFolder = async () => {
    try {
      // Modern browsers with File System Access API
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - File System Access API
        const dirHandle = await window.showDirectoryPicker();
        
        // 선택된 폴더의 이름과 현재 운영체제에 따라 경로 설정
        const folderName = dirHandle.name;
        console.log('Selected folder:', folderName);
        
        // 실제로는 브라우저에서 전체 경로를 얻기 어려우므로
        // 사용자가 선택한 폴더명을 기반으로 안전한 경로 생성
        const userAgent = navigator.userAgent.toLowerCase();
        let selectedPath: string;
        
        if (userAgent.includes('mac')) {
          // Mac의 경우 보통 Desktop이나 Downloads에서 선택하므로
          selectedPath = `/tmp/${folderName}`;
        } else if (userAgent.includes('windows')) {
          selectedPath = `C:\\temp\\${folderName}`;
        } else {
          selectedPath = `/tmp/${folderName}`;
        }
        
        setOutputPath(selectedPath);
        setMessage(`폴더가 선택되었습니다: ${folderName} → ${selectedPath}`);
        setTimeout(() => setMessage(''), 5000);
      } else {
        // Fallback: 사용자가 직접 경로 입력하도록 안내
        const userInput = prompt(
          '폴더 선택이 지원되지 않는 브라우저입니다.\n직접 절대 경로를 입력해주세요:\n\n예시:\n• Mac: /Users/username/Desktop/kakao-chats\n• Windows: C:\\Users\\username\\Desktop\\kakao-chats\n• 안전한 경로: /tmp/kakao-chats'
        );
        
        if (userInput && userInput.trim()) {
          const trimmedPath = userInput.trim();
          // 간단한 경로 유효성 검사
          if (trimmedPath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(trimmedPath)) {
            setOutputPath(trimmedPath);
            setMessage(`경로가 설정되었습니다: ${trimmedPath}`);
            setTimeout(() => setMessage(''), 3000);
          } else {
            setError('올바른 절대 경로를 입력해주세요.');
            setTimeout(() => setError(''), 3000);
          }
        }
      }
    } catch (error) {
      console.error('폴더 선택 중 오류:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('폴더 선택이 취소되었습니다.');
      } else {
        setError('폴더 선택 중 오류가 발생했습니다.');
      }
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('notionToken');
    const dbId = localStorage.getItem('notionDbId');
    const savedOutputPath = localStorage.getItem('outputPath');
    if (token) setNotionToken(token);
    if (dbId) setNotionDbId(dbId);
    if (savedOutputPath) {
      setOutputPath(savedOutputPath);
    } else {
      // 기본값을 프로젝트 루트의 output 폴더로 설정 (권한 문제 방지)
      setOutputPath('/tmp/kakao-notion-output');
    }
    fetchOutputFiles();
  }, []);

  useEffect(() => {
    fetchOutputFiles();
  }, [outputPath]);

  const fetchOutputFiles = async () => {
    try {
      const res = await fetch(`/api/get-files?outputPath=${encodeURIComponent(outputPath)}`);
      const data = await res.json();
      if (res.ok) {
        setOutputFiles(data.files);
      } else {
        setError('파일 목록을 가져오는 중 오류 발생: ' + data.error);
      }
    } catch (error) {
      setError('파일 목록을 가져오는 중 오류 발생');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveNotionSettings = () => {
    // 절대경로 유효성 검사 (클라이언트 사이드용)
    const isAbsolutePath = outputPath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(outputPath);
    if (!isAbsolutePath) {
      setError('저장 폴더 경로는 절대경로여야 합니다. (예: /tmp/kakao-chats 또는 C:\\temp\\kakao-chats)');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    // 권한이 필요할 수 있는 경로 경고
    if (outputPath.includes('/Users/') && !outputPath.includes('/tmp') && !outputPath.includes('/Desktop')) {
      setMessage('선택한 경로에 권한이 필요할 수 있습니다. 문제가 발생하면 /tmp/ 경로를 사용해보세요.');
      setTimeout(() => setMessage(''), 5000);
    }
    
    localStorage.setItem('notionToken', notionToken);
    localStorage.setItem('notionDbId', notionDbId);
    localStorage.setItem('outputPath', outputPath);
    setMessage('설정이 저장되었습니다!');
    setTimeout(() => setMessage(''), 3000);
    fetchOutputFiles(); // 폴더 경로 변경 시 파일 목록 새로고침
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
    formData.append('outputPath', outputPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchOutputFiles(); // Refresh file list
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

  const handleRegisterToNotion = async (all = false) => {
    const filesToRegister = all ? outputFiles : selectedFiles;
    if (filesToRegister.length === 0) {
      setError('등록할 파일을 선택해주세요.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!notionToken || !notionDbId) {
      setError('노션 API 토큰과 데이터베이스 ID를 입력해주세요.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/notion-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionToken, notionDbId, selectedFiles: filesToRegister, outputPath }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setSelectedFiles([]);
      } else {
        setError(`오류: ${data.error}`);
      }
    } catch (error) {
      setError('노션 등록 중 오류 발생');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (value === 'all') {
      if (checked) {
        setSelectedFiles(outputFiles);
      } else {
        setSelectedFiles([]);
      }
      return;
    }

    if (checked) {
      setSelectedFiles(prev => [...prev, value]);
    } else {
      setSelectedFiles(prev => prev.filter(file => file !== value));
    }
  };

  const testNotionConnection = async () => {
    if (!notionToken || !notionDbId) {
      setError('Notion 토큰과 데이터베이스 ID를 먼저 입력해주세요.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/test-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notionToken,
          notionDbId,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage(`${data.message}\n\n데이터베이스 정보:\n• 제목: ${data.database.title}\n• 속성: ${data.database.properties.join(', ')}`);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 10000); // 10초 후 메시지 삭제
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">
          카카오톡 대화 → 노션 자동 등록
        </h1>
        
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">설정</h2>
          <div className="flex flex-col space-y-4">
            <input
              type="password"
              placeholder="노션 API 토큰"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="노션 데이터베이스 ID"
              value={notionDbId}
              onChange={(e) => setNotionDbId(e.target.value)}
              className="border p-2 rounded"
            />
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">저장 폴더 경로</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="절대 경로 (예: /tmp/kakao-chats 또는 /Users/username/Documents/kakao-chats)"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  className="flex-1 border p-2 rounded"
                />
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  폴더 선택
                </button>
              </div>
              
              {/* 빠른 경로 설정 버튼들 */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickPath('tmp')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  임시폴더 (/tmp)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPath('desktop')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  바탕화면
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPath('downloads')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  다운로드
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                권한 문제가 발생하면 "임시폴더" 버튼을 사용하거나, 직접 접근 가능한 폴더 경로를 입력해주세요.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveNotionSettings}
                className="rounded-full bg-gray-500 text-white px-6 py-2 font-semibold hover:bg-gray-600 transition-colors"
              >
                설정 저장
              </button>
              <button
                onClick={testNotionConnection}
                disabled={loading}
                className="rounded-full bg-purple-500 text-white px-6 py-2 font-semibold hover:bg-purple-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? '연결 테스트 중...' : '연결 테스트'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mt-8">
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
          <div className="flex flex-col items-start space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="all"
                value="all"
                onChange={handleFileSelection}
                checked={selectedFiles.length === outputFiles.length && outputFiles.length > 0}
                className="mr-2"
              />
              <label htmlFor="all">전체 선택</label>
            </div>
            {outputFiles.map(file => (
              <div key={file} className="flex items-center">
                <input
                  type="checkbox"
                  id={file}
                  value={file}
                  onChange={handleFileSelection}
                  checked={selectedFiles.includes(file)}
                  className="mr-2"
                />
                <label htmlFor={file}>{file}</label>
              </div>
            ))}
          </div>
          {outputFiles.length > 0 && (
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => handleRegisterToNotion(false)}
                className="rounded-full bg-green-500 text-white px-6 py-2 font-semibold hover:bg-green-600 transition-colors" disabled={loading}>
                {loading ? '노션 등록 중...' : '선택 파일만 노션 등록'}
              </button>
              <button
                onClick={() => handleRegisterToNotion(true)}
                className="rounded-full bg-purple-500 text-white px-6 py-2 font-semibold hover:bg-purple-600 transition-colors" disabled={loading}>
                {loading ? '노션 등록 중...' : '전체 파일 노션 등록'}
              </button>
            </div>
          )}
        </div>

        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

      </main>
    </div>
  );
}
