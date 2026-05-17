// Kuponluk.com - Client JS

// Toast notification
function showToast(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = toast.className.replace('show', '').trim(); }, 3000);
}

// Copy to clipboard
function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Kupon kodu kopyalandı! ✓', 'success');
    if (el) { el.classList.add('copy-animation'); setTimeout(() => el.classList.remove('copy-animation'), 300); }
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Kupon kodu kopyalandı! ✓', 'success');
  });
}

// Reveal coupon code
document.addEventListener('click', function(e) {
  const revealBtn = e.target.closest('.reveal-btn');
  if (revealBtn) {
    const codeBox = revealBtn.closest('.code-box');
    if (codeBox) {
      codeBox.classList.add('code-revealed');
      const code = codeBox.dataset.code;
      if (code) {
        copyText(code, codeBox);
        // Track use
        const couponId = codeBox.dataset.couponId;
        if (couponId) {
          fetch(`/kupon/${couponId}/kullan`, { method: 'POST' }).catch(() => {});
        }
      }
    }
  }

  // Click on code-revealed box = copy again
  const codeBox = e.target.closest('.code-box.code-revealed');
  if (codeBox && !e.target.closest('.reveal-btn')) {
    const code = codeBox.dataset.code;
    if (code) copyText(code, codeBox);
  }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', () => menu.classList.toggle('hidden'));
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item .faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  // Star rating
  document.querySelectorAll('.star-rating[data-coupon-id]').forEach(ratingEl => {
    const stars = ratingEl.querySelectorAll('.star');
    const couponId = ratingEl.dataset.couponId;
    let currentRating = parseInt(ratingEl.dataset.userRating) || 0;

    updateStars(stars, currentRating);

    stars.forEach((star, i) => {
      star.addEventListener('mouseover', () => updateStars(stars, i + 1));
      star.addEventListener('mouseout', () => updateStars(stars, currentRating));
      star.addEventListener('click', () => {
        const rating = i + 1;
        fetch(`/kupon/${couponId}/puan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            currentRating = rating;
            updateStars(stars, currentRating);
            const avgEl = document.getElementById('ratingAvg');
            const countEl = document.getElementById('ratingCount');
            if (avgEl) avgEl.textContent = data.avg;
            if (countEl) countEl.textContent = data.count;
            showToast(`${rating} yıldız verdiniz!`, 'success');
          } else {
            showToast(data.message || 'Puan verebilmek için giriş yapın', 'error');
          }
        });
      });
    });
  });

  // Save coupon button
  document.querySelectorAll('.save-coupon-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const couponId = this.dataset.couponId;
      fetch(`/kupon/${couponId}/kaydet`, { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.action === 'saved') {
              this.innerHTML = '❤️ Kaydedildi';
              this.classList.add('text-orange-600');
              showToast('Kupon kaydedildi!', 'success');
            } else {
              this.innerHTML = '🤍 Kaydet';
              this.classList.remove('text-orange-600');
              showToast('Kupon kaldırıldı', 'info');
            }
          } else {
            showToast(data.message || 'Giriş yapmanız gerekiyor', 'error');
          }
        });
    });
  });

  // Favorite store button
  const favBtn = document.getElementById('favoriteBtn');
  if (favBtn) {
    favBtn.addEventListener('click', function() {
      const slug = this.dataset.storeSlug;
      fetch(`/magaza/${slug}/favori`, { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.action === 'added') {
              this.innerHTML = '❤️ Favorilerimde';
              this.style.background = '#FF6B00';
              this.style.color = 'white';
              showToast('Mağaza favorilere eklendi!', 'success');
            } else {
              this.innerHTML = '🤍 Favorilere Ekle';
              this.style.background = '';
              this.style.color = '';
              showToast('Mağaza favorilerden çıkarıldı', 'info');
            }
          } else {
            showToast(data.message || 'Giriş yapmanız gerekiyor', 'error');
          }
        });
    });
  }

  // Newsletter form
  const nlForm = document.getElementById('newsletterForm');
  if (nlForm) {
    nlForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input[name="email"]').value;
      fetch('/abone-ol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      .then(r => r.json())
      .then(data => {
        const msg = document.getElementById('newsletterMsg');
        if (msg) {
          msg.textContent = data.message;
          msg.classList.remove('hidden');
        }
        if (data.success) {
          nlForm.reset();
          showToast(data.message, 'success');
        }
      });
    });
  }

  // Profile tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      this.classList.add('active');
      const panel = document.getElementById(tabId);
      if (panel) panel.classList.remove('hidden');
    });
  });
});

function updateStars(stars, count) {
  stars.forEach((star, i) => {
    star.classList.toggle('filled', i < count);
  });
}

// Get store color based on name
function storeColor(name) {
  const colors = ['#FF6B00','#e91e63','#9c27b0','#3f51b5','#2196f3','#00bcd4','#009688','#4caf50','#ff9800','#f44336'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
