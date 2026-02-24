function joinUrl(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const body = await readJson(request);

  const agentBase = body.base;
  const endpoint = body.endpoint;
  const method = body.method || "GET";

  if (!agentBase || !endpoint) {
    return new Response(JSON.stringify({ error: "missing base/endpoint" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-store" },
    });
  }

  const url = joinUrl(agentBase, endpoint);

  const headers = { "content-type": "application/json" };
  // OPTIONAL: kalau agent kamu mau pakai API KEY, set env di Pages: AGENT_API_KEY
  if (env.AGENT_API_KEY) headers["x-api-key"] = env.AGENT_API_KEY;

  const r = await fetch(url, {
    method,
    headers,
    body: (method === "GET" ? undefined : JSON.stringify(body.payload || {})),
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}
