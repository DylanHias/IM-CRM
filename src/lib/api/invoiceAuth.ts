export async function getXvantageToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_XVANTAGE_CLIENT_ID;
  const clientSecret = process.env.XVANTAGE_CLIENT_SECRET;
  const tokenUrl = process.env.NEXT_PUBLIC_XVANTAGE_TOKEN_URL;

  if (!clientId || !clientSecret || !tokenUrl) {
    return 'mock-token';
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Xvantage OAuth failed: ${res.status}`);
  }

  const json = await res.json();
  return json.access_token;
}
