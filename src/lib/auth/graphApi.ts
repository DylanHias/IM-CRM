import { getAccessToken } from '@/lib/auth/authHelpers';

export interface GraphUserProfile {
  jobTitle: string | null;
  mobilePhone: string | null;
  businessPhones: string[];
  country: string | null;
  city: string | null;
  officeLocation: string | null;
  birthday: string | null;
}

export async function fetchUserProfile(): Promise<GraphUserProfile | null> {
  const token = await getAccessToken(['User.Read']);
  if (!token) return null;
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me?$select=jobTitle,mobilePhone,businessPhones,country,city,officeLocation,birthday',
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      jobTitle?: string | null;
      mobilePhone?: string | null;
      businessPhones?: string[] | null;
      country?: string | null;
      city?: string | null;
      officeLocation?: string | null;
      birthday?: string | null;
    };
    return {
      jobTitle: json.jobTitle?.trim() || null,
      mobilePhone: json.mobilePhone?.trim() || null,
      businessPhones: Array.isArray(json.businessPhones) ? json.businessPhones.filter(Boolean) : [],
      country: json.country?.trim() || null,
      city: json.city?.trim() || null,
      officeLocation: json.officeLocation?.trim() || null,
      birthday: json.birthday && !json.birthday.startsWith('0001') ? json.birthday : null,
    };
  } catch (err) {
    console.error('[auth] Failed to fetch user profile:', err);
    return null;
  }
}

export async function fetchBirthday(): Promise<string | null> {
  const profile = await fetchUserProfile();
  return profile?.birthday ?? null;
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
