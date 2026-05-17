const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.get('/profil', requireAuth, (req, res) => {
  const db = getDb();

  const savedCoupons = db.prepare(`
    SELECT cp.*, s.name as store_name, s.slug as store_slug, s.logo_url,
           usc.created_at as saved_at
    FROM user_saved_coupons usc
    JOIN coupons cp ON usc.coupon_id = cp.id
    JOIN stores s ON cp.store_id = s.id
    WHERE usc.user_id = ?
    ORDER BY usc.created_at DESC
  `).all(req.session.user.id);

  const favoriteStores = db.prepare(`
    SELECT s.*, c.name as category_name, c.icon as category_icon,
           COUNT(cp.id) as active_coupons,
           uf.created_at as favorited_at
    FROM user_favorites uf
    JOIN stores s ON uf.store_id = s.id
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN coupons cp ON cp.store_id = s.id
    WHERE uf.user_id = ?
    GROUP BY s.id
    ORDER BY uf.created_at DESC
  `).all(req.session.user.id);

  res.render('profile', {
    title: 'Profilim - Kuponluk.com',
    savedCoupons,
    favoriteStores,
  });
});

module.exports = router;
