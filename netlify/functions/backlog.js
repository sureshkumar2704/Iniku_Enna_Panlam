const { supabaseRequest } = require('./_supabaseProxy');

exports.handler = async function (event) {
  const method = event.httpMethod;
  const qs = event.queryStringParameters || {};
  const id = qs.id;

  try {
    if (method === 'GET') {
      // support ?ownerId=xyz
      if (qs.ownerId) {
        const q = { ownerId: `eq.${qs.ownerId}` };
        const r = await supabaseRequest('backlog', 'GET', q);
        return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
      }
      if (id) {
        const q = { id: `eq.${id}` };
        const r = await supabaseRequest('backlog', 'GET', q);
        return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
      }
      const r = await supabaseRequest('backlog', 'GET');
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const r = await supabaseRequest('backlog', 'POST', null, [body]);
      return { statusCode: r.status || 201, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      if (!id && !body.id) return { statusCode: 400, body: 'id required', headers: cors() };
      const useId = id || body.id;
      const q = { id: `eq.${useId}` };
      const r = await supabaseRequest('backlog', 'PATCH', q, body);
      return { statusCode: r.status, body: JSON.stringify(r.data), headers: cors() };
    }

    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: 'id required', headers: cors() };
      const q = { id: `eq.${id}` };
      const r = await supabaseRequest('backlog', 'DELETE', q);
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
