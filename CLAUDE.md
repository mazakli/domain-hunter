# domain-hunter deposu — Proje Bağlamı (Claude Code için)

## ⚠️ KRİTİK: Bu depoda 2 farklı site var

Bu tek depo (`domain-hunter`) iki ayrı siteye hizmet eder.
**Hiçbir zaman branch'leri ve projeleri karıştırma.**

---

## Proje Haritası

| Railway Projesi | Site | Repo | Branch |
|-----------------|------|------|--------|
| `modest-alignment` | **724eczane.com** | domain-hunter | `eczane-site` |
| `harmonious-bravery` | **kuponluk.com** | domain-hunter | `create-coupon-marketplace-uw3yz` |

---

## 724eczane.com

- **Railway:** `modest-alignment`
- **Branch:** `eczane-site`
- **Geliştirme branch'i:** `claude/api-724eczane-kMic3`
- Türkiye'nin 81 ilindeki nöbetçi eczaneleri listeleyen Node.js/Express uygulaması
- NosyAPI üzerinden eczane verisi çekilir
- **NOSYAPI_KEY** asla koda yazılmaz; Railway environment variable olarak saklanır
- Her `res.render()` çağrısına `iller: require('./data/iller')` geçilmeli (navbar.ejs kullanır)

### Dosya yapısı
```
server.js
package.json
railway.toml
data/iller.js          # 81 il + ilçe
public/css/style.css
public/js/app.js
public/robots.txt
public/favicon.svg
views/home.ejs
views/il.ejs
views/ilce.ejs
views/widget.ejs
views/eczane-ekle.ejs
views/sitene-ekle.ejs
views/iletisim.ejs
views/gizlilik.ejs
views/kullanim-kosullari.ejs
views/cerez-politikasi.ejs
views/partials/navbar.ejs
views/partials/footer.ejs
```

---

## kuponluk.com

- **Railway:** `harmonious-bravery`
- **Branch:** `create-coupon-marketplace-uw3yz`
- Kupon marketplace projesi

---

## Genel Kurallar

1. **Yeni proje eklenirse** yeni bir Railway projesi ve yeni bir branch açılır — mevcut branch'lere dokunulmaz.
2. **Bir siteye ait değişiklikler** yalnızca o sitenin branch'ine push edilir.
3. **main branch** sadece ortak dokuman (bu dosya gibi) için kullanılır; hiçbir sitenin production kodu main'den deploy edilmez.
4. Railway'e doğrudan `git push` çalışmaz (HTTP 403); değişiklikler `mcp__github__push_files` ile push edilir.
