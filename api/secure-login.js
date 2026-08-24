const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'method_not_allowed' });
  try {
    const code = String(req.body?.code || '').replace(/\D/g, '').slice(0, 4);
    const remember = req.body?.remember !== false;
    if (!/^\d{4}$/.test(code)) return res.status(400).json({ status: 'invalid_code' });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_alfhd_user`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_code: code, p_remember: remember }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) return res.status(502).json({ status: 'upstream_error', upstreamStatus: r.status });
    return res.status(200).json(data || { status: 'empty_response' });
  } catch (e) {
    return res.status(500).json({ status: 'proxy_error' });
  }
}
