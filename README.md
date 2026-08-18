# Пътен Пазител (RoadGuardian)

## За проекта
Пътен Пазител е платформа за докладване и проследяване на инциденти с диви животни по пътищата в България. Проектът включва уеб интерфейс с Leaflet карта и Node.js/MySQL бекенд.

---

## Уеб интерфейс

### Структура
- `public/` – лендинг страница и публична карта на инциденти
- `backend/` – Node.js/Express сървър с MySQL база данни
- `starter/` – скриптове за стартиране
- `old-versions/` – архивирани стари версии и компоненти

### Бърз старт
1. **Бекенд**
   ```bash
   cd backend
   npm install
   npm run init-db  # Създава база и таблици
   npm start        # Стартира на http://localhost:5050
   ```

2. **Уеб интерфейс**
   ```bash
   cd public
   # Стартирай HTTP сървър на порт 8080
   python -m http.server 8080
   # или използвай starter/run_all.bat
   # Отворете http://localhost:8080
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

## Портове
- **Бекенд**: `http://localhost:5050`
- **Фронтенд**: `http://localhost:8080`

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
