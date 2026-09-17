# Пътен Пазител (RoadGuardian)

## За проекта
Пътен Пазител е платформа за докладване и проследяване на инциденти с диви животни по пътищата в България. Проектът включва уеб интерфейс с Leaflet карта и Node.js бекенд (вградена SQLite база чрез `sql.js`, с MySQL-съвместим адаптер).

## Разработка с една команда

```bash
npm run install:all   # еднократно: root + backend + admin зависимости
npm run dev            # стартира backend (3333), admin Vite dev server (5173) и public сайта (7777)
```

`npm run dev` е дефиниран в root [package.json](package.json) и използва `concurrently`, за да пусне трите процеса паралелно в един терминал. Admin desk-ът с AG Grid е на http://localhost:5173 (hot reload), публичният сайт е на http://localhost:7777, а API-то е на http://localhost:3333/api.

На Windows, вместо терминал, може да се стартира [starter/dev.bat](starter/dev.bat) с двойно кликване – инсталира зависимостите автоматично при първо стартиране и пуска същите три процеса. (За разлика от [starter/start.bat](starter/start.bat), който отваря пакетираното desktop приложение с вече билднатия admin panel, без hot reload.)

---

## Windows приложение

Стартирайте `starter/start.bat` с двойно щракване или инсталирайте готовия `.exe`. Това отваря SOS Animal като отделно Windows приложение и автоматично стартира локалния бекенд, интерфейса и вградената база данни.

Не е необходим MySQL, XAMPP или друг външен сървър. Данните се пазят локално във файл `%APPDATA%\\SOS Animal\\sos-animal.sqlite`.

### Администраторски панел

При стартиране на desktop приложението първо се показва администраторски вход. Използвайте `admin@puten-pazitel.local` с парола `admin123`. След вход менюто дава достъп до:
- обзор и статистика на сигналите;
- филтриране и търсене на сигнали;
- промяна на статус и добавяне на бележки;
- изтриване на сигнал;
- създаване на нов сигнал;
- спешни контакти и изход.

Само профили с роля `admin` могат да отворят този панел.

### Създаване на `.exe`
```bash
cd desktop
npm install
npm run dist
```

Инсталаторът се създава в `desktop/dist/SOS Animal Setup 1.0.0.exe`. При първото стартиране приложението автоматично създава базата, таблиците и тестовите профили.

### Data Operations Center

The active desktop admin panel is built from `admin/` and emitted to `public/admin-build/`. It uses AG Grid Community for filtering, multi-column sorting, inline status/notes editing, checkbox selection, and bulk updates. GSAP provides view and modal transitions, while Leaflet powers the coordinate picker.

To build the admin panel during development:

```bash
cd backend
npm install
cd ../admin
npm install
npm run build
```

The backend exposes `PATCH /api/incidents/bulk` for authenticated admin or organization users. Socket.io broadcasts committed `incident.created`, `incident.updated`, `incident.bulkUpdated`, and `incident.deleted` events to connected admin sessions. The Electron app continues to open `http://localhost:7777/admin.html`, and packages the generated `public/` assets through the existing desktop build configuration.

## Уеб интерфейс

### Структура
- `public/` – лендинг страница и публична карта на инциденти, плюс билднатия admin desk (`admin-build/`)
- `admin/` – Vite + AG Grid изходен код на администраторския desk (билдва се в `public/admin-build/`)
- `backend/` – Node.js/Express API (MVC: `src/controllers`, `src/routes`, `src/services`, `src/middleware`, `src/db`), вградена база данни
- `starter/` – скриптове за стартиране
- `old-versions/` – архивирани стари версии и компоненти

### Ръчен старт
1. **Бекенд**
   ```bash
   cd backend
   npm install
  npm run init-db  # Ръчна инициализация, ако е необходима
  npm start        # Стартира на http://localhost:3333
   ```

2. **Уеб интерфейс**
   ```bash
   cd public
   # Стартирай HTTP сървър на порт 8080
   python -m http.server 8080
   # или използвай starter/run_all.bat
    # Отворете http://localhost:7777
   ```

### Функционалности
- **Публична карта**: Всеки може да разглежда инциденти без вход
- **Докладване**: Влезлите потребители могат да докладват инциденти (дълго натискане върху картата)
- **Админ инструменти**: Администратори могат да маркират инциденти като "Изчистено"
- **Български контакти**: Спешна помощ (112), БАБХ, СДВР/КАТ
- **Гео-ограничение**: Картата е фокусирана само върху България
- **Защита при шофиране**: Показва предупреждение при скорост > 7 м/с
- **JWT автентикация**: Сигурен вход с токени
- **Remember Me**: Запазване на имейл за по-бърз вход
- **Scroll-to-Top**: Бутон за връщане към началото на страницата

---

## Данни за вход за тестване

### Администратор
- Имейл: `admin@puten-pazitel.local`
- Парола: `admin123`

### Тестов потребител
- Имейл: `test@user.com`
- Парола: `password123`

---

## База данни

### Схема (MySQL)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('guest', 'reporter', 'admin') DEFAULT 'reporter',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  status VARCHAR(32) NOT NULL,
  species VARCHAR(100),
  photo_url VARCHAR(255),
  reporter_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## Технологии

### Бекенд
- **Node.js** + **Express**
- **MySQL2** за база данни
- **JWT** за автентикация
- **bcrypt** за криптиране на пароли
- **multer** за качване на файлове

### Фронтенд
- **Vanilla JavaScript**
- **Leaflet** за интерактивни карти
- **Tailwind CSS** за стилизация
- **GSAP** за анимации
- **Font Awesome** за икони

---

### Портове
- **Бекенд**: `http://localhost:3333`
- **Фронтенд**: `http://localhost:7777`

---

## Лиценз
MIT License

---

## Поддръжка
За въпроси и докладване на проблеми, моля използвайте GitHub issues.

---

## ЛAYOUT PLAN

### Desktop Login Screen
- **Background**: High-contrast gradient from dark blue to black.
- **Logo**: Positioned at the top center with a white background.
- **Input Fields**: 
  - **Email**: White text on a dark blue background.
  - **Password**: White text on a dark blue background.
- **Buttons**: 
  - **Login**: High-contrast blue button with white text.
  - **Forgot Password**: Link with high-contrast blue text.
- **Footer**: 
  - **Remember Me**: Checkbox with high-contrast blue text.
  - **Sign Up**: Link with high-contrast blue text.

### Maps
- **Background**: High-contrast gradient from light gray to dark gray.
- **Markers**: High-contrast red markers for incidents.
- **Controls**: 
  - **Zoom In/Out**: High-contrast blue buttons.
  - **Legend**: Positioned at the bottom left with high-contrast text.
- **Info Window**: 
  - **Background**: White with a high-contrast blue border.
  - **Text**: High-contrast black text.

### Admin Dashboard
- **Background**: High-contrast gradient from light gray to dark gray.
- **Sidebar**: 
  - **Menu Items**: High-contrast blue text on a dark gray background.
  - **Active Item**: Highlighted with a high-contrast blue border.
- **Main Content**: 
  - **Headers**: High-contrast blue text.
  - **Tables**: 
    - **Headers**: High-contrast blue text.
    - **Rows**: Alternating light and dark gray rows.
  - **Buttons**: 
    - **Primary**: High-contrast blue button with white text.
    - **Secondary**: High-contrast gray button with black text.
- **Footer**: 
  - **Logout**: High-contrast blue button with white text.
  - **Help**: Link with high-contrast blue text.
