function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/giris?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function loadUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

module.exports = { requireAuth, loadUser };
