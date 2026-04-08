import { fetchProfilePhoto } from '@/lib/auth/graphApi';

// Mock getAccessToken
vi.mock('@/lib/auth/authHelpers', () => ({
  getAccessToken: vi.fn(),
}));

import { getAccessToken } from '@/lib/auth/authHelpers';
const mockGetAccessToken = vi.mocked(getAccessToken);

describe('fetchProfilePhoto', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns base64 data URI when photo exists', async () => {
    mockGetAccessToken.mockResolvedValue('fake-token');

    const fakeBlob = new Blob([new Uint8Array([0xFF, 0xD8])], { type: 'image/jpeg' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    });

    const result = await fetchProfilePhoto();
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(mockGetAccessToken).toHaveBeenCalledWith(['User.Read']);
  });

  it('returns null when no token available', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    const result = await fetchProfilePhoto();
    expect(result).toBeNull();
  });

  it('returns null on 404 (no photo set)', async () => {
    mockGetAccessToken.mockResolvedValue('fake-token');
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    const result = await fetchProfilePhoto();
    expect(result).toBeNull();
  });
});
