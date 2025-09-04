import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/notion-register';
import { Client } from '@notionhq/client';

jest.mock('@notionhq/client', () => {
  const mockPagesCreate = jest.fn();
  return {
    Client: jest.fn(() => ({
      pages: {
        create: mockPagesCreate,
      },
    })),
  };
});

describe('/api/notion-register', () => {
  beforeEach(() => {
    (Client as jest.Mock).mockClear();
    (new Client().pages.create as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 500 if notion API fails', async () => {
    (new Client().pages.create as jest.Mock).mockRejectedValue(new Error('Notion API Error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        notionToken: 'test-token',
        notionDbId: 'test-db-id',
        selectedFiles: ['2025-01-01.md'],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Error registering to Notion' });
  });

  it('returns 200 on success', async () => {
    (new Client().pages.create as jest.Mock).mockResolvedValue({});

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        notionToken: 'test-token',
        notionDbId: 'test-db-id',
        selectedFiles: ['2025-01-01.md'],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Successfully registered to Notion' });
  });
});