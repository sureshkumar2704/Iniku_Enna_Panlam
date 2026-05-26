const { supabaseRequest } = require('./_supabaseProxy');

exports.handler = async function (event) {
  const method = event.httpMethod;
  const qs = event.queryStringParameters || {};
  const id = qs.id;

  try {
    if (method === 'GET') {
      if (id) {
        const q = { id: `eq.${id}` };
        const r = await supabaseRequest('destination', 'GET', q);
        return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
      }
      const r = await supabaseRequest('destination', 'GET');
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const r = await supabaseRequest('destination', 'POST', null, [body]);
      return { statusCode: r.status || 201, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      if (!id) return { statusCode: 400, body: 'id required', headers: cors() };
      const q = { id: `eq.${id}` };
      const r = await supabaseRequest('destination', 'PATCH', q, body);
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: 'id required', headers: cors() };
      const q = { id: `eq.${id}` };
      const r = await supabaseRequest('destination', 'DELETE', q);
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
