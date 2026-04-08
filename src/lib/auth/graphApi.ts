import { getAccessToken } from '@/lib/auth/authHelpers';

export async function fetchProfilePhoto(): Promise<string | null> {
  const token = await getAccessToken(['User.Read']);
  if (!token) return null;

  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    return await blobToDataUri(blob);
  } catch (err) {
    console.error('[auth] Failed to fetch profile photo:', err);
    return null;
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
