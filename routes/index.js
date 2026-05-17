const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();

  const featuredStores = db.prepare(`
    SELECT s.*, c.name as category_name, c.icon as category_icon,
           COUNT(cp.id) as active_coupons
    FROM stores s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN coupons cp ON cp.store_id = s.id
    WHERE s.is_featured = 1
    GROUP BY s.id
    ORDER BY s.name
    LIMIT 20
  `).all();

  const newCoupons = db.prepare(`
    SELECT cp.*, s.name as store_name, s.slug as store_slug, s.logo_url
    FROM coupons cp
    JOIN stores s ON cp.store_id = s.id
    ORDER BY cp.created_at DESC
    LIMIT 8
  `).all();

  const popularCoupons = db.prepare(`
    SELECT cp.*, s.name as store_name, s.slug as store_slug, s.logo_url
    FROM coupons cp
    JOIN stores s ON cp.store_id = s.id
    ORDER BY cp.use_count DESC
    LIMIT 8
  `).all();

  const categories = db.prepare(`
    SELECT c.*, COUNT(cp.id) as coupon_count
    FROM categories c
    LEFT JOIN stores s ON s.category_id = c.id
    LEFT JOIN coupons cp ON cp.store_id = s.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();

  const stats = {
    totalCoupons: db.prepare('SELECT COUNT(*) as c FROM coupons').get().c,
    totalStores: db.prepare('SELECT COUNT(*) as c FROM stores').get().c,
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    totalCategories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
  };

  res.render('index', {
    title: 'Kuponluk.com - Türkiye\'nin Kupon Merkezi',
    featuredStores,
    newCoupons,
    popularCoupons,
    categories,
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
