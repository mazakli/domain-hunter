const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');

router.get('/giris', (req, res) => {
  if (req.session.user) return res.redirect('/profil');
  res.render('login', {
    title: 'Giriş Yap - Kuponluk.com',
    error: null,
    redirect: req.query.redirect || '/',
  });
});

router.post('/giris', async (req, res) => {
  const { email, password, redirect } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.render('login', { title: 'Giriş Yap - Kuponluk.com', error: 'E-posta veya şifre hatalı.', redirect: redirect || '/' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.render('login', { title: 'Giriş Yap - Kuponluk.com', error: 'E-posta veya şifre hatalı.', redirect: redirect || '/' });
  }

  req.session.user = { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin };
  res.redirect(redirect || '/');
});

router.get('/kayit', (req, res) => {
  if (req.session.user) return res.redirect('/profil');
  res.render('register', { title: 'Üye Ol - Kuponluk.com', error: null });
});

router.post('/kayit', async (req, res) => {
  const { username, email, password, password2 } = req.body;
  const db = getDb();

  if (!username || !email || !password) {
    return res.render('register', { title: 'Üye Ol - Kuponluk.com', error: 'Tüm alanları doldurunuz.' });
  }
  if (password !== password2) {
    return res.render('register', { title: 'Üye Ol - Kuponluk.com', error: 'Şifreler eşleşmiyor.' });
  }
  if (password.length < 6) {
    return res.render('register', { title: 'Üye Ol - Kuponluk.com', error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    return res.render('register', { title: 'Üye Ol - Kuponluk.com', error: 'Bu e-posta adresi zaten kayıtlı.' });
  }
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.render('register', { title: 'Üye Ol - Kuponluk.com', error: 'Bu kullanıcı adı zaten alınmış.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);

  req.session.user = { id: result.lastInsertRowid, username, email, is_admin: 0 };
  res.redirect('/');
});

router.get('/cikis', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
