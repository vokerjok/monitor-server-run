README - JOKO Central Panel (Auto Register)

1) Deploy ke Cloudflare Pages
- Upload folder ini ke GitHub repo atau langsung ke Pages.
- Settings:
  - Build command: (kosong)
  - Output directory: public
- Functions otomatis dari folder /functions

2) Buat KV + Binding
- Cloudflare dashboard -> KV -> Create namespace: JOKO_AGENTS
- Cloudflare Pages -> Settings -> Functions -> KV namespaces
  - Binding name: JOKO_AGENTS
  - Namespace: JOKO_AGENTS

3) Set Environment Variables di Pages
- PANEL_API_KEY = (string rahasia)  contoh: rahasia123
(Optional)
- AGENT_API_KEY = kalau agent kamu pakai header x-api-key (panel -> agent)

4) Agent VPS: set ENV dan jalankan agent.py
Wajib:
- AGENT_ID=joko1  (unik per VPS)
- PANEL_URL=https://<project>.pages.dev
- PANEL_API_KEY=rahasiamu (harus sama dengan Pages env)

Optional:
- REGISTER_INTERVAL=60
- JOKO_DATA_DIR=joko-data

Jalankan:
  python3 agent.py

5) Buka panel:
https://<project>.pages.dev

Catatan Tunnel:
- Quick tunnel (*.trycloudflare.com) tidak bisa custom "joko1.trycloudflare.com"
- Kalau mau nama stabil, gunakan Cloudflare Zero Trust Named Tunnel + domain sendiri.
