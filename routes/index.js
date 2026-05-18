const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();

  const categories = db.prepare(`
    SELECT c.*, COUNT(cp.id) as coupon_count
    FROM categories c
    LEFT JOIN stores s ON s.category_id = c.id
    LEFT JOIN coupons cp ON cp.store_id = s.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();

  const popularBrands = db.prepare(`
    SELECT s.id, s.name, s.slug, s.logo_url,
           COUNT(cp.id) as coupon_count,
           MAX(cp.discount_value) as max_discount,
           COALESCE(SUM(cp.use_count), 0) as total_uses
    FROM stores s
    JOIN coupons cp ON cp.store_id = s.id
    GROUP BY s.id
    ORDER BY total_uses DESC
    LIMIT 16
  `).all();

  const newBrands = db.prepare(`
    SELECT s.id, s.name, s.slug, s.logo_url,
           COUNT(cp.id) as coupon_count,
           MAX(cp.discount_value) as max_discount
    FROM stores s
    JOIN coupons cp ON cp.store_id = s.id
    GROUP BY s.id
    ORDER BY MAX(cp.created_at) DESC
    LIMIT 16
  `).all();

  const expiringBrands = db.prepare(`
    SELECT s.id, s.name, s.slug, s.logo_url,
           COUNT(cp.id) as coupon_count,
           MAX(cp.discount_value) as max_discount
    FROM stores s
    JOIN coupons cp ON cp.store_id = s.id
    WHERE cp.expiry_date IS NOT NULL AND cp.expiry_date > datetime('now')
    GROUP BY s.id
    ORDER BY MIN(cp.expiry_date) ASC
    LIMIT 16
  `).all();

  const sliderStores = db.prepare(`
    SELECT s.id, s.name, s.slug, s.logo_url, COUNT(cp.id) as coupon_count
    FROM stores s
    LEFT JOIN coupons cp ON cp.store_id = s.id
    GROUP BY s.id
    HAVING coupon_count > 0
    ORDER BY s.name
    LIMIT 24
  `).all();

  const stats = {
    totalCoupons: db.prepare('SELECT COUNT(*) as c FROM coupons').get().c,
    totalStores: db.prepare('SELECT COUNT(*) as c FROM stores').get().c,
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    totalCategories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
  };

  res.render('index', {
    title: 'Kuponluk.com - Türkiye\'nin Kupon Merkezi',
    categories,
    popularBrands,
    newBrands,
    expiringBrands,
    sliderStores,
    stats,
  });
});

router.get('/arama', (req, res) => {
  const db = getDb();
  const q = (req.query.q || '').trim();
  const type = req.query.type || 'all';

  let coupons = [], stores = [];

  if (q.length > 0) {
    if (type === 'all' || type === 'coupon') {
      coupons = db.prepare(`
        SELECT cp.*, s.name as store_name, s.slug as store_slug, s.logo_url
        FROM coupons cp
        JOIN stores s ON cp.store_id = s.id
        WHERE cp.title LIKE ? OR cp.code LIKE ? OR cp.description LIKE ?
        ORDER BY cp.use_count DESC
        LIMIT 20
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (type === 'all' || type === 'store') {
      stores = db.prepare(`
        SELECT s.*, c.name as category_name
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.name LIKE ? OR s.description LIKE ?
        ORDER BY s.coupon_count DESC
        LIMIT 10
      `).all(`%${q}%`, `%${q}%`);
    }
  }

  res.render('search', {
    title: q ? `"${q}" için Arama Sonuçları - Kuponluk.com` : 'Arama - Kuponluk.com',
    q, type, coupons, stores,
  });
});

module.exports = router;
