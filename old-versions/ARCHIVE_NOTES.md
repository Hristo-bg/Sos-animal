# Архивирани компоненти - RoadGuardian

Тази папка съдържа стари версии и компоненти, които не се използват в текущата версия на проекта.

## Съдържание

### 📄 Документация
- `README_old.md` - Оригиналният README файл
- `README_V2.md` - Документация за RoadGuardian V2.0 (професионален GIS & Rescue Suite)

### 🧪 Тестови файлове
- `add_test_data.js` - Скрипт за добавяне на тестови данни в базата
- `test_admin_login.ps1` - PowerShell скрипт за тестване на admin вход
- `test_login.json` - JSON файл с тестови данни за вход

### 🗺️ Web Dashboard V2
- `web_dashboard/` - Пълна V2 версия на уеб дашборда с:
  - Google Maps интеграция
  - Firebase Firestore
  - API статус уиджет
  - Split-screen layout
  - Export функционалност
  - Heatmap визуализация

### 📱 Мобилно приложение (Flutter) 
- `lib/` - Flutter мобилно приложение с:
  - AI Image Service (TensorFlow Lite)
  - Notification Service (FCM)
  - Incident V2 модели
  - Firebase интеграция

### 🔥 Firebase конфигурация
- `firebase/` - Firestore и Storage security rules:
  - RBAC (Role-Based Access Control)
  - Claim-once enforcement
  - Photo access control

### 🛠️ Скриптове
- `scripts/` - Mock data generator за тестване

### 🖥️ Vanilla admin panel (заменен от Vite + AG Grid)
- `legacy-vanilla-admin-panel/` - Старият vanilla JS admin panel (`admin-panel.js`, `admin-app.js`, `admin.css`, `admin-panel.css`, `admin-intelligence.css`), заменен от `admin/` (Vite + AG Grid), билднат в `public/admin-build/` и зареждан от `public/admin.html`

### 🚀 Стари startup скриптове (заменени от `starter/dev.bat` + `npm run dev`)
- `run_all.bat` - стартираше бекенда и публичния сайт ръчно; текстът му твърдеше грешен порт (5050) за бекенда, който реално слуша на 3333; не инсталираше зависимости и не стартираше admin desk-а
- `start_sos_animal.bat` - дублираше логиката на `starter/start.bat`, но отваряше бекенда и публичния сайт директно вместо през Electron; също не стартираше admin desk-а (Vite)
- И двата са заменени от `starter/dev.bat`, който обвива `npm run dev` (бекенд + admin Vite dev server + публичен сайт, с автоматична инсталация на зависимости при първо стартиране)

## Бележки

Тези компоненти са архивирани, защото:
1. **Web Dashboard V2** - По-сложен от нужното за текущата версия
2. **Flutter App** - В процес на разработка, не е активен
3. **Firebase** - Не се използва в текущата MySQL версия
4. **Тестови файлове** - Временно използвани за debugging

## Активна версия

Текущата активна версия се намира в главната директория:
- `public/` - Уеб интерфейс с Leaflet карта
- `backend/` - Node.js + MySQL бекенд
- `starter/` - Стартиращи скриптове

## Възстановяване

Ако се наложи да възстановите някой от архивираните компоненти:
1. Копирайте нужната папка/файл в главната директория
2. Обновете зависимостите и конфигурациите
3. Тествайте функционалността

---
*Архивирано на: 2 май 2026 г.*
