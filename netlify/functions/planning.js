// netlify/functions/planning.js
//
// Serverless functie voor de Schoolplanner.
// Draait op Netlify's servers — NIET in de browser.
// De JSONBin sleutels en leerlingcode staan als omgevingsvariabelen
// op Netlify en zijn nooit zichtbaar voor bezoekers.

exports.handler = async (event) => {
  const SCHOOL_CODE = process.env.SCHOOL_CODE;
  const JSONBIN_KEY = process.env.JSONBIN_KEY;
  const JSONBIN_ID  = process.env.JSONBIN_ID;

  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Family-Code',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Controleer leerlingcode (zelfde header als gezinsplanner voor hergebruik)
  const code = event.headers['x-family-code'] || event.headers['X-Family-Code'];
  if (!code || code !== SCHOOL_CODE) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Ongeldige leerlingcode' }),
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
        headers: {
          'X-Master-Key': JSONBIN_KEY,
          'X-Bin-Meta':   'false',
        }
      });
      if (!res.ok) throw new Error(`JSONBin fout: ${res.status}`);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const res  = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`JSONBin fout: ${res.status}`);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Methode niet toegestaan' }) };

  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
