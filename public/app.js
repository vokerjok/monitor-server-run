const $ = (id) => document.getElementById(id);

async function getAgents() {
  const r = await fetch("/api/agents", { cache: "no-store" });
  const j = await r.json();
  // KV record shape: {id,name,base,info,updated_at}
  return (j.agents || []).map(x => ({
    id: x.id,
    name: x.name,
    base: x.base,
    info: x.info || {},
    updated_at: x.updated_at
  }));
}

async function proxy(base, endpoint, method = "GET", payload = null) {
  const r = await fetch("/api/proxy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ base, endpoint, method, payload }),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: r.status }; }
}

function badge(ok, textOn="RUNNING", textOff="STOPPED") {
  return `<span class="px-2 py-1 rounded-lg text-xs ${ok ? "bg-emerald-700/40 text-emerald-200 border border-emerald-700/60" : "bg-rose-700/30 text-rose-200 border border-rose-700/60"}">${ok ? textOn : textOff}</span>`;
}

function cardTpl(a, s, info) {
  const tunnel = (s?.tunnel_url || info?.tunnel_url || a.base || "-");
  const ips = (info?.local_ips || a.info?.local_ips || []).join(", ") || "-";
  const host = info?.host || a.info?.host || "-";
  const agentId = info?.agent_id || a.id || "-";

  return `
  <div class="p-4 rounded-2xl border border-slate-800 bg-black/30">
    <div class="flex items-center justify-between gap-2">
      <div>
        <div class="font-semibold text-lg">${a.name || agentId}</div>
        <div class="text-xs text-slate-400">Agent ID: <span class="text-slate-200">${agentId}</span></div>
        <div class="text-xs text-slate-400">Host: <span class="text-slate-200">${host}</span></div>
        <div class="text-xs text-slate-400 break-all">${a.base}</div>
      </div>
      <div class="text-right text-xs text-slate-400">
        <div>IP: <span class="text-slate-200">${ips}</span></div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      ${badge(!!s?.login, "LOGIN ON", "LOGIN OFF")}
      ${badge(!!s?.loop, "LOOP ON", "LOOP OFF")}
      ${badge(!!s?.buat_link, "BUAT_LINK ON", "BUAT_LINK OFF")}
      <span class="px-2 py-1 rounded-lg text-xs bg-slate-800/50 border border-slate-700/60 text-slate-200">
        Updated: ${a.updated_at ? new Date(a.updated_at).toLocaleString() : "-"}
      </span>
    </div>

    <div class="mt-3 text-sm">
      <div class="text-slate-400">Tunnel:</div>
      <a class="underline text-sky-300 break-all" href="${tunnel !== "-" ? tunnel : "#"}" target="_blank">${tunnel}</a>
    </div>

    <div class="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
      <button data-act="startLoop" class="btn px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">Start Loop</button>
      <button data-act="stopLoop" class="btn px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600">Stop Loop</button>
      <button data-act="restartLoop" class="btn px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-600">Restart Loop</button>

      <button data-act="startLogin" class="btn px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">Start Login</button>
      <button data-act="stopAll" class="btn px-3 py-2 rounded-xl bg-rose-800 hover:bg-rose-700">Stop ALL</button>
      <button data-act="cleanLocks" class="btn px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Clean .lock</button>
    </div>

    <pre class="mt-3 text-xs text-slate-300 bg-black/30 border border-slate-800 rounded-xl p-3 overflow-auto whitespace-pre-wrap max-h-40"
    >CPU: ${s?.cpu_percent ?? "-"}% • RAM: ${s?.ram_used_percent ?? "-"}% • Disk: ${s?.disk_used_percent ?? "-"}%</pre>
  </div>`;
}

async function load() {
  const agents = await getAgents();
  const grid = $("grid");
  grid.innerHTML = "";

  for (const a of agents) {
    let s = null, info = null;
    try { s = await proxy(a.base, "status", "GET"); } catch {}
    try { info = await proxy(a.base, "agent/info", "GET"); } catch {}

    const wrap = document.createElement("div");
    wrap.innerHTML = cardTpl(a, s, info);
    grid.appendChild(wrap);

    wrap.querySelectorAll(".btn").forEach(btn => {
      btn.onclick = async () => {
        const act = btn.dataset.act;
        if (act === "startLoop") await proxy(a.base, "start/loop", "POST");
        if (act === "stopLoop") await proxy(a.base, "stop/loop", "POST"); // stop_loop sudah auto cleanup locks
        if (act === "restartLoop") {
          await proxy(a.base, "stop/loop", "POST");
          await proxy(a.base, "start/loop", "POST");
        }
        if (act === "startLogin") await proxy(a.base, "start/login", "POST");
        if (act === "stopAll") await proxy(a.base, "stop/all", "POST");
        if (act === "cleanLocks") await proxy(a.base, "cleanup/locks", "POST");
        await load();
      };
    });
  }
}

$("btnRefresh").onclick = load;

$("btnStopAllAgents").onclick = async () => {
  if (!confirm("Stop ALL di semua agent?")) return;
  const agents = await getAgents();
  for (const a of agents) await proxy(a.base, "stop/all", "POST");
  await load();
};

$("btnRestartActive").onclick = async () => {
  if (!confirm("Restart hanya agent yang LOOP-nya aktif?")) return;
  const agents = await getAgents();
  for (const a of agents) {
    const s = await proxy(a.base, "status", "GET");
    if (s?.loop) {
      await proxy(a.base, "stop/loop", "POST");
      await proxy(a.base, "start/loop", "POST");
    }
  }
  await load();
};

load();
