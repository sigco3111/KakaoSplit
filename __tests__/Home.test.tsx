import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import Home from '../app/page';

global.fetch = jest.fn();

describe('Home', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/get-files') {
        return Promise.resolve({
          json: () => Promise.resolve({ files: ['2025-01-01.md', '2025-01-02.md'] }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ message: 'Success' }),
        ok: true,
      });
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the heading', async () => {
    await act(async () => {
        render(<Home />);
    });
    const heading = screen.getByRole('heading', { name: /KakaoTalk to Notion/i });
    expect(heading).toBeInTheDocument();
  });

  it('updates the file state on file input change', async () => {
    await act(async () => {
        render(<Home />);
    });
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['(⌐□_□)>'], 'chucknorris.csv', { type: 'text/csv' });
    await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
    });
  });

  it('calls the upload API on form submit', async () => {
    await act(async () => {
        render(<Home />);
    });
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['(⌐□_□)>'], 'chucknorris.csv', { type: 'text/csv' });
    
    await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const uploadButton = screen.getByRole('button', { name: /Upload CSV/i });
    await act(async () => {
        fireEvent.click(uploadButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
  });

  it('saves notion settings to local storage', async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    await act(async () => {
        render(<Home />);
    });
    const tokenInput = screen.getByPlaceholderText('Notion API Token');
    const dbIdInput = screen.getByPlaceholderText('Notion Database ID');
    const saveButton = screen.getByRole('button', { name: /Save Notion Settings/i });

    await act(async () => {
        fireEvent.change(tokenInput, { target: { value: 'test-token' } });
        fireEvent.change(dbIdInput, { target: { value: 'test-db-id' } });
        fireEvent.click(saveButton);
    });

    expect(setItemSpy).toHaveBeenCalledWith('notionToken', 'test-token');
    expect(setItemSpy).toHaveBeenCalledWith('notionDbId', 'test-db-id');
  });

  it('selects and deselects all files', async () => {
    await act(async () => {
        render(<Home />);
    });
    await waitFor(() => screen.getByText('2025-01-01.md'));

    const selectAllCheckbox = screen.getByLabelText('Select All');
    await act(async () => {
        fireEvent.click(selectAllCheckbox);
    });

    const fileCheckboxes = screen.getAllByRole('checkbox');
    fileCheckboxes.forEach(checkbox => {
        if((checkbox as HTMLInputElement).value !== 'all'){
            expect(checkbox).toBeChecked();
        }
    });

    await act(async () => {
        fireEvent.click(selectAllCheckbox);
    });
    fileCheckboxes.forEach(checkbox => {
        if((checkbox as HTMLInputElement).value !== 'all'){
            expect(checkbox).not.toBeChecked();
        }
    });
  });

  it('calls the notion-register API on button click', async () => {
    await act(async () => {
        render(<Home />);
    });
    await waitFor(() => screen.getByText('2025-01-01.md'));

    const tokenInput = screen.getByPlaceholderText('Notion API Token');
    const dbIdInput = screen.getByPlaceholderText('Notion Database ID');

    await act(async () => {
        fireEvent.change(tokenInput, { target: { value: 'test-token' } });
        fireEvent.change(dbIdInput, { target: { value: 'test-db-id' } });
    });

    const selectAllCheckbox = screen.getByLabelText('Select All');
    await act(async () => {
        fireEvent.click(selectAllCheckbox);
    });

    const registerButton = screen.getByRole('button', { name: /Register Selected to Notion/i });
    await act(async () => {
        fireEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notion-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notionToken: 'test-token',
          notionDbId: 'test-db-id',
          selectedFiles: ['2025-01-01.md', '2025-01-02.md'],
        }),
      });
    });
  });
});