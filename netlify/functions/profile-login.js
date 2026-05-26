const { supabaseRequest } = require('./_supabaseProxy');

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(statusCode, body) {
  return { statusCode, headers: { ...cors(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function publicProfile(record) {
  return {
    id: record.id,
    user_id: record.user_id || record.id,
    email: record.email || '',
    username: record.username || '',
    full_name: record.full_name || '',
    first_name: record.first_name || '',
    last_name: record.last_name || '',
    image_url: record.image_url || '',
    provider: record.provider || 'supabase-profile',
    generated_password: record.generated_password || '',
    generated_from_email: record.generated_from_email || '',
    updated_at: record.updated_at || null,
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const identifier = String(body.identifier || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return json(400, { error: 'Email or username and password are required.' });
    }

    const query = {
      or: `(email.eq.${identifier},username.eq.${identifier})`,
      generated_password: `eq.${password}`,
      limit: '1',
    };

    const result = await supabaseRequest('user_profiles', 'GET', query);
    if (result.status >= 400) return json(result.status, { error: 'Could not check Supabase profile credentials.' });

    const profile = Array.isArray(result.data) ? result.data[0] : null;
    if (!profile) return json(401, { error: 'Invalid email/username or password.' });

    return json(200, { ok: true, profile: publicProfile(profile) });
  } catch (error) {
    console.error('Profile login failed', error);
    return json(500, { error: error.message || 'Profile login failed.' });
  }
};
