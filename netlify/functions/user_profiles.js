const { supabaseRequest } = require('./_supabaseProxy');

exports.handler = async function (event) {
  const method = event.httpMethod;
  const qs = event.queryStringParameters || {};
  const id = qs.id;

  try {
    if (method === 'OPTIONS') return { statusCode: 204, body: '', headers: cors() };

    if (method === 'GET') {
      const query = id ? { id: `eq.${id}`, limit: '1' } : null;
      const r = await supabaseRequest('user_profiles', 'GET', query);
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const r = await supabaseRequest('user_profiles', 'POST', null, [body]);
      return { statusCode: r.status || 201, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const useId = id || body.id;
      if (!useId) return { statusCode: 400, body: 'id required', headers: cors() };
      const r = await supabaseRequest('user_profiles', 'PATCH', { id: `eq.${useId}` }, body);
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    return { statusCode: 405, body: 'Method not allowed', headers: cors() };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err), headers: cors() };
  }
};

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}
