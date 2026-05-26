const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1/users';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  if (!CLERK_SECRET_KEY) {
    return json(400, { error: 'Missing CLERK_SECRET_KEY.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const userId = String(payload.userId || '').trim();
  const username = String(payload.username || '').trim();
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const password = String(payload.password || '').trim();

  if (!userId) {
    return json(400, { error: 'Missing userId.' });
  }

  const body = {};
  if (username) body.username = username;
  if (firstName) body.first_name = firstName;
  if (lastName) body.last_name = lastName;
  if (password) body.password = password;

  if (Object.keys(body).length === 0) {
    return json(400, { error: 'Nothing to update.' });
  }

  try {
    const response = await fetch(`${CLERK_API_URL}/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const clerkError = data?.errors?.[0]?.long_message || data?.errors?.[0]?.message || data?.message || text || 'Clerk update failed.';
      return json(response.status, { error: clerkError, details: data });
    }

    return json(200, {
      ok: true,
      synced: {
        username: Boolean(username),
        firstName: Boolean(firstName),
        lastName: Boolean(lastName),
        password: Boolean(password),
      },
      user: data,
    });
  } catch (error) {
    console.error('Clerk user update failed', error);
    return json(500, { error: error.message || 'Clerk user update failed.' });
  }
};
