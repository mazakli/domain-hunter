function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/giris?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function loadUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  try {
    const { getDb } = require('../database');
    const db = getDb();
    res.locals.navCategories = db.prepare('SELECT name, slug FROM categories ORDER BY name ASC').all();
  } catch (e) {
    res.locals.navCategories = [];
  }
  next();
}

module.exports = { requireAuth, loadUser };
