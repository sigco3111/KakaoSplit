'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [notionDbId, setNotionDbId] = useState('');
  const [outputFiles, setOutputFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('notionToken');
    const dbId = localStorage.getItem('notionDbId');
    if (token) setNotionToken(token);
    if (dbId) setNotionDbId(dbId);
    fetchOutputFiles();
  }, []);

  const fetchOutputFiles = async () => {
    try {
      const res = await fetch('/api/get-files');
      const data = await res.json();
      if (res.ok) {
        setOutputFiles(data.files);
      } else {
        setError('Error fetching files: ' + data.error);
      }
    } catch (error) {
      setError('Error fetching files');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveNotionSettings = () => {
    localStorage.setItem('notionToken', notionToken);
    localStorage.setItem('notionDbId', notionDbId);
    setMessage('Notion settings saved!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    const formData = new FormData();
    formData.append('file', file);

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
        setError(`Error: ${data.error}`);
      }
    } catch (error) {
      setError('Error uploading file');
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
      setError('Please select files to register.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!notionToken || !notionDbId) {
      setError('Please provide Notion API Token and Database ID.');
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
        body: JSON.stringify({ notionToken, notionDbId, selectedFiles: filesToRegister }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setSelectedFiles([]);
      } else {
        setError(`Error: ${data.error}`);
      }
    } catch (error) {
      setError('Error registering to Notion');
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">
          KakaoTalk to Notion
        </h1>
        
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Notion Settings</h2>
          <div className="flex flex-col space-y-4">
            <input
              type="password"
              placeholder="Notion API Token"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Notion Database ID"
              value={notionDbId}
              onChange={(e) => setNotionDbId(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleSaveNotionSettings}
              className="rounded-full bg-gray-500 text-white px-6 py-2 font-semibold hover:bg-gray-600 transition-colors"
            >
              Save Notion Settings
            </button>
          </div>
        </div>

        <div className="w-full max-w-md mt-8">
          <h2 className="text-2xl font-semibold mb-4">Upload CSV</h2>
          <form onSubmit={handleUploadSubmit} className="flex flex-col items-center">
            <input type="file" onChange={handleFileChange} accept=".csv" className="mb-4" data-testid="file-input" />
            <button type="submit" className="rounded-full bg-blue-500 text-white px-6 py-2 font-semibold hover:bg-blue-600 transition-colors" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>
        </div>

        <div className="w-full max-w-md mt-8">
          <h2 className="text-2xl font-semibold mb-4">Generated Files</h2>
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
              <label htmlFor="all">Select All</label>
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
                {loading ? 'Registering...' : 'Register Selected to Notion'}
              </button>
              <button
                onClick={() => handleRegisterToNotion(true)}
                className="rounded-full bg-purple-500 text-white px-6 py-2 font-semibold hover:bg-purple-600 transition-colors" disabled={loading}>
                {loading ? 'Registering...' : 'Register All to Notion'}
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
