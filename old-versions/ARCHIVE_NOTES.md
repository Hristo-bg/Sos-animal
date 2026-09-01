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
