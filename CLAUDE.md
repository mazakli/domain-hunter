# 724eczane.com — Proje Bağlamı (Claude Code için)

## Bu depo nedir?

Bu depo **724eczane.com** projesine aittir.
Türkiye'nin 81 ilindeki nöbetçi eczaneleri listeleyen bir Node.js/Express web uygulamasıdır.

## KRİTİK: main branch Production'dır

- `main` branch **Railway PaaS** üzerinde production'a deploy edilir.
- `main` branch'i **asla temizleme, silme veya sıfırlama**.
- Yeni projeler için bu depoya dokunma; ayrı bir depo oluştur.
- `main` branch'e doğrudan `git push` çalışmaz (HTTP 403). Değişiklikler `mcp__github__push_files` ile push edilir.

## Branch yapısı

| Branch | Amaç |
|--------|------|
| `main` | Production — Railway buradan deploy eder |
| `claude/api-724eczane-kMic3` | Aktif geliştirme branch'i |

## Proje yapısı

```
server.js          # Express uygulaması — tüm route'lar burada
package.json
railway.toml
data/
  iller.js         # 81 il + ilçe verisi (module.exports)
public/
  css/style.css
  js/app.js
  robots.txt
  favicon.svg
views/
  home.ejs
  il.ejs
  ilce.ejs
  widget.ejs
  eczane-ekle.ejs
  sitene-ekle.ejs
  iletisim.ejs
  gizlilik.ejs
  kullanim-kosullari.ejs
  cerez-politikasi.ejs
  partials/
    navbar.ejs     # iller değişkenini gerektirir
    footer.ejs
```

## Önemli kurallar

1. **NOSYAPI_KEY** asla koda yazılmaz; Railway environment variable olarak saklanır.
2. Her `res.render()` çağrısına `iller: require('./data/iller')` geçilmeli — navbar.ejs bunu kullanır.
3. NosyAPI endpoint: `https://www.nosyapi.com/apiv2/service/pharmacies-on-duty`
4. Cache, Türkiye saatiyle 09:00 / 12:00 / 15:00 / 17:00 / 19:00'da temizlenir.
5. IndexNow key: `91cec650afe934b2933b74fc702cc0ba` (public by design, hardcoded güvenlidir).

## Bu depoya yeni proje ekleme

**Yapma.** Farklı bir proje için yeni bir GitHub deposu aç.
Bu depo yalnızca 724eczane.com'a aittir.
