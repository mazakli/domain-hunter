require('dotenv').config();
var express = require('express');
var cors = require('cors');
var fetch = require('node-fetch');
var path = require('path');
var app = express();
var PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory cache for pharmacy API responses ──────────────────────────────
var pharmacyCache = new Map();
var CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Helper: date info for tabs ───────────────────────────────────────────────
function getDateInfo() {
  var now = new Date();
  var days = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
  var daysT = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var format = function(d) {
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' ' + daysT[d.getDay()];
  };
  var toISO = function(d) { return d.toISOString().split('T')[0]; };
  var yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  var tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  return {
    dun:   { label: format(yesterday), iso: toISO(yesterday) },
    bugun: { label: format(now),       iso: toISO(now) },
    yarin: { label: format(tomorrow),  iso: toISO(tomorrow) }
  };
}

// ── Demo pharmacy data (when no API key) ─────────────────────────────────────
var demoPharmacies = [
  { name: 'MERKEZ ECZANESİ',  dist: 'MERKEZ', address: 'Atatürk Cad. No:15',              phone: '0312 555 11 22', lat: '', lng: '' },
  { name: 'SAĞLIK ECZANESİ', dist: 'MERKEZ', address: 'Cumhuriyet Mah. 123 Sok. No:5',   phone: '0312 555 33 44', lat: '', lng: '' },
  { name: 'GÜVEN ECZANESİ',  dist: 'MERKEZ', address: 'İstiklal Cad. No:42',             phone: '0312 555 55 66', lat: '', lng: '' },
  { name: 'HAYAT ECZANESİ',  dist: 'MERKEZ', address: 'Yıldız Mah. Gül Sok. No:3',       phone: '0312 555 77 88', lat: '', lng: '' }
];

// ── Pharmacy API proxy ────────────────────────────────────────────────────────
app.get('/api/eczaneler', async function(req, res) {
  var il    = (req.query.il    || '').trim();
  var ilce  = (req.query.ilce  || '').trim();
  var tarih = (req.query.tarih || '').trim();

  if (!il || !tarih) {
    return res.status(400).json({ error: 'il ve tarih gerekli' });
  }

  var apiKey = process.env.NOSYAPI_KEY;
  if (!apiKey) {
    return res.json({ pharmacies: demoPharmacies, demo: true });
  }

  var cacheKey = il + '|' + ilce + '|' + tarih;
  var cached = pharmacyCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
    return res.json({ pharmacies: cached.data });
  }

  try {
    var apiUrl = 'https://www.nosyapi.com/apidoc/nobetci-eczane?il=' + encodeURIComponent(il);
    if (ilce) apiUrl += '&ilce=' + encodeURIComponent(ilce);
    apiUrl += '&tarih=' + encodeURIComponent(tarih);

    var r = await fetch(apiUrl, {
      headers: { 'Authorization': 'apikey ' + apiKey }
    });
    var json = await r.json();

    var pharmacies = [];
    if (json && json.data && Array.isArray(json.data)) {
      pharmacies = json.data.map(function(p) {
        return {
          name:    p.eczaneAdi    || p.name    || '',
          dist:    p.ilce         || p.dist    || '',
          address: p.adres        || p.address || '',
          phone:   p.telefon      || p.phone   || '',
          lat:     p.latitude     || p.lat     || '',
          lng:     p.longitude    || p.lng     || ''
        };
      });
    }

    pharmacyCache.set(cacheKey, { data: pharmacies, ts: Date.now() });
    res.json({ pharmacies: pharmacies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Province / District pages ─────────────────────────────────────────────────
app.get('/nobetci-:slug', function(req, res, next) {
  var slug = req.params.slug;
  var iller = require('./data/iller');

  // Province match
  var il = iller.find(function(i) { return i.slug === slug; });
  if (il) {
    return res.render('il', {
      il: il,
      iller: iller,
      today: getDateInfo(),
      title: il.name + ' Nöbetçi Eczaneleri - Bugün Açık Eczaneler',
      description: 'Bugün ' + il.name + ' ilindeki nöbetçi eczaneleri bulun. Adres, telefon ve yol tarifi bilgileri.'
    });
  }

  // Province-District match
  for (var i = 0; i < iller.length; i++) {
    var cur = iller[i];
    if (slug.startsWith(cur.slug + '-')) {
      var ilceSlug = slug.slice(cur.slug.length + 1);
      var ilce = cur.districts.find(function(d) { return d.slug === ilceSlug; });
      if (ilce) {
        return res.render('ilce', {
          il: cur,
          ilce: ilce,
          iller: iller,
          today: getDateInfo(),
          title: cur.name + ' ' + ilce.name + ' Nöbetçi Eczaneleri',
          description: 'Bugün ' + cur.name + ' ' + ilce.name + ' ilçesindeki nöbetçi eczaneleri bulun.'
        });
      }
    }
  }

  next(); // 404
});

// ── Home page ─────────────────────────────────────────────────────────────────
app.get('/', function(req, res) {
  var iller = require('./data/iller');
  res.render('home', {
    iller: iller,
    title: 'Türkiye Nöbetçi Eczane Rehberi - Bugün Açık Eczaneler',
    description: "Türkiye'nin 81 ilindeki nöbetçi eczaneleri bulun. Dün, bugün ve yarın nöbetçi eczaneleri arayın."
  });
});

// ── Existing Semrush routes ───────────────────────────────────────────────────
app.get('/health', function(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/debug-env', function(req, res) {
  var allKeys = Object.keys(process.env);
  var customKeys = allKeys.filter(function(k) {
    return !k.startsWith('PATH') && !k.startsWith('npm') && !k.startsWith('NODE') && !k.startsWith('HOME') && !k.startsWith('PWD');
  });
  res.json({
    KEY_EXISTS: !!process.env.SEMRUSH_API_KEY,
    KEY_LENGTH: process.env.SEMRUSH_API_KEY ? process.env.SEMRUSH_API_KEY.length : 0,
    CUSTOM_KEYS: customKeys
  });
});

app.get('/api/semrush/organic', async function(req, res) {
  var domain   = req.query.domain;
  var database = req.query.database || 'tr';
  var limit    = req.query.limit    || '1000';
  var minvol   = req.query.minvol   || '0';

  if (!domain) {
    return res.status(400).json({ error: 'domain gerekli' });
  }

  var apiKey = process.env.SEMRUSH_API_KEY || '4f80607c2028e05c12764e36ac090e6c';
  if (!apiKey) {
    return res.status(500).json({ error: 'API key eksik' });
  }

  var u = new URL('https://api.semrush.com/');
  u.searchParams.set('type',           'domain_organic');
  u.searchParams.set('key',            apiKey);
  u.searchParams.set('domain',         domain);
  u.searchParams.set('database',       database);
  u.searchParams.set('display_limit',  String(Math.min(Number(limit), 10000)));
  u.searchParams.set('export_columns', 'Ph,Po,Nq,Cp,Ur,Tr');
  u.searchParams.set('display_sort',   'tr_desc');

  var mv = parseInt(minvol) || 0;
  if (mv > 0) {
    u.searchParams.set('display_filter', '+|Nq|Gt|' + (mv - 1));
  }

  try {
    var r    = await fetch(u.toString());
    var text = await r.text();

    if (text.includes('TOTAL LIMIT EXCEEDED')) {
      return res.status(402).json({ error: 'Semrush limiti doldu' });
    }
    if (text.startsWith('ERROR')) {
      return res.status(400).json({ error: text.slice(0, 200) });
    }

    var lines = text.trim().split('\n');
    if (lines.length < 2) {
      return res.status(404).json({ error: 'Sonuc yok' });
    }

    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var c  = lines[i].split(';');
      if (c.length < 3) continue;
      var kw = (c[0] || '').trim().toLowerCase();
      if (!kw) continue;
      rows.push({
        kw:  kw,
        pos: parseInt(c[1])   || 0,
        vol: parseInt(c[2])   || 0,
        cpc: parseFloat(c[3]) || 0,
        url: (c[4] || '').trim()
      });
    }

    res.json({ domain: domain, database: database, total: rows.length, rows: rows });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('CALISIYOR port=' + PORT);
  console.log('SEMRUSH_API_KEY=' + (process.env.SEMRUSH_API_KEY ? 'VAR' : 'YOK'));
  console.log('NOSYAPI_KEY='     + (process.env.NOSYAPI_KEY     ? 'VAR' : 'YOK'));
});
