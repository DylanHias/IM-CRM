import { getAccessToken } from '@/lib/auth/authHelpers';

export async function fetchBirthday(): Promise<string | null> {
  const token = await getAccessToken(['User.Read']);
  if (!token) return null;
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=birthday', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { birthday?: string };
    // Graph returns ISO datetime; treat year 0001 as "unset"
    if (!json.birthday || json.birthday.startsWith('0001')) return null;
    return json.birthday;
  } catch (err) {
    console.error('[auth] Failed to fetch birthday:', err);
    return null;
  }
}

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
