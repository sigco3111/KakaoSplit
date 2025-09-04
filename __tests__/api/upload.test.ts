
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/upload';

jest.mock('formidable', () => ({
  formidable: () => ({
    parse: (req, callback) => {
      callback(null, {}, {}); // No files
    },
  }),
}));

describe('/api/upload', () => {
  it('returns 400 if no file is uploaded', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: 'No file uploaded' });
  });
});
