require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const fetch     = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ─────────────────────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: izinsiz origin: ' + origin));
  }
}));

app.use(express.json());
app.use('/api/', rateLimit({ windowMs: 60000, max: 30,
  message: { error: 'Cok fazla istek, 1 dakika bekle.' } }));

/* ── Saglik ────────────────────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Semrush Proxy calisiyor', time: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ── Ana endpoint ──────────────────────────────────────────────────── */
app.get('/api/semrush/organic', async (req, res) => {
  const { domain, database = 'tr', limit = '1000', minvol = '0' } = req.query;

  if (!domain)
    return res.status(400).json({ error: 'domain parametresi gerekli' });
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(domain))
    return res.status(400).json({ error: 'Gecersiz domain' });

  const apiKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'SEMRUSH_API_KEY env degiskeni tanimli degil' });

  const u = new URL('https://api.semrush.com/');
  u.searchParams.set('type',           'domain_organic');
  u.searchParams.set('key',            apiKey);
  u.searchParams.set('domain',         domain);
  u.searchParams.set('database',       database);
  u.searchParams.set('display_limit',  String(Math.min(Number(limit), 10000)));
  u.searchParams.set('export_columns', 'Ph,Po,Nq,Cp,Ur,Tr');
  u.searchParams.set('display_sort',   'tr_desc');

  const mv = parseInt(minvol) || 0;
  if (mv > 0) u.searchParams.set('display_filter', '+|Nq|Gt|' + (mv - 1));

  console.log('[' + new Date().toISOString() + '] ' + domain + ' / ' + database + ' / ' + limit);

  try {
    const r    = await fetch(u.toString(), { timeout: 20000 });
    const text = await r.text();

    if (text.includes('TOTAL LIMIT EXCEEDED'))
      return res.status(402).json({ error: 'Semrush API limiti doldu.' });
    if (text.startsWith('ERROR'))
      return res.status(400).json({ error: 'Semrush hata: ' + text.slice(0, 200) });
    if (!text || !text.trim())
      return res.status(404).json({ error: 'Bos yanit dondu.' });

    const lines = text.trim().split('\n');
    if (lines.length < 2)
      return res.status(404).json({ error: 'Sonuc bulunamadi.' });

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';');
      if (c.length < 3) continue;
      const kw = (c[0] || '').trim().toLowerCase();
      if (!kw) continue;
      rows.push({ kw, pos: parseInt(c[1]) || 0, vol: parseInt(c[2]) || 0,
                  cpc: parseFloat(c[3]) || 0, url: (c[4] || '').trim(), tr: parseFloat(c[5]) || 0 });
    }

    console.log('  -> ' + rows.length + ' kelime donduruldu');
    res.json({ domain, database, total: rows.length, rows });

  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Semrush baglanamadi: ' + err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Semrush Proxy calisiyor, port: ' + PORT);
});
