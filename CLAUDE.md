# mazakli/domain-hunter — Proje Haritası

Bu repo iki ayrı siteyi barındırır. Her biri ayrı bir Railway projesinde çalışır.
**KESİNLİKLE KARIŞTIRMA.**

## 724eczane.com
- **Railway Projesi:** modest-alignment
- **Branch:** `eczane-site`
- **Açıklama:** Nöbetçi eczane rehberi (NosyAPI tabanlı, Bootstrap, node-fetch)
- **Teknoloji:** Express + EJS, SQLite YOK, better-sqlite3 YOK
- Startup log: `724ECZANE CALISIYOR port=`

## kuponluk.com
- **Railway Projesi:** harmonious
- **Branch:** `claude/create-coupon-marketplace-uw3zy`
- **Açıklama:** Türkiye kupon ve indirim platformu
- **Teknoloji:** Express + EJS, SQLite (better-sqlite3), Tailwind CSS
- Startup log: `Kuponluk.com sunucu çalışıyor`

## Kural
- `eczane-site` branch'ine yapılan her değişiklik SADECE 724eczane.com içindir
- `claude/create-coupon-marketplace-uw3zy` branch'ine yapılan her değişiklik SADECE kuponluk.com içindir
- `main` branch'i boş kalmalı, hiçbir proje kodu içermemeli
