import { useAuthStore } from '@/store/authStore';

describe('authStore profilePhoto', () => {
  beforeEach(() => useAuthStore.getState().clearAuth());

  it('stores and clears profile photo', () => {
    useAuthStore.getState().setProfilePhoto('data:image/jpeg;base64,/9j/abc');
    expect(useAuthStore.getState().profilePhoto).toBe('data:image/jpeg;base64,/9j/abc');

    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().profilePhoto).toBeNull();
  });
});
