export async function onRequestGet({ env }) {
  const list = await env.JOKO_AGENTS.list({ prefix: "agent:" });
  const agents = [];

  for (const k of list.keys) {
    const v = await env.JOKO_AGENTS.get(k.name);
    if (!v) continue;
    try { agents.push(JSON.parse(v)); } catch {}
  }

  agents.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

  return new Response(JSON.stringify({ agents }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}
