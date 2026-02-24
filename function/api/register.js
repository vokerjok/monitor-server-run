export async function onRequestPost({ request, env }) {
  const key = request.headers.get("x-api-key");
  if (!env.PANEL_API_KEY || key !== env.PANEL_API_KEY) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body = await request.json().catch(() => ({}));
  const { id, name, base, info } = body;

  if (!id || !base) {
    return new Response(JSON.stringify({ error: "missing id/base" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const record = {
    id,
    name: name || id,
    base,
    info: info || {},
    updated_at: new Date().toISOString(),
  };

  // TTL 10 menit: agent wajib heartbeat (REGISTER_INTERVAL)
  await env.JOKO_AGENTS.put(`agent:${id}`, JSON.stringify(record), { expirationTtl: 600 });

  return new Response(JSON.stringify({ ok: true, saved: record }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
