# Web Larek Express

Учебный fullstack-проект интернет-магазина: витрина товаров, корзина,
оформление заказов и админ-панель. Бэкенд — REST API на Express + MongoDB,
фронтенд — SPA на React + Vite.

## Стек

**Backend**
- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) — access + refresh токены
- bcryptjs — хеширование паролей
- multer — загрузка файлов
- celebrate (Joi) — валидация запросов
- node-cron — периодическая очистка временных файлов
- winston + express-winston — логирование
- ts-node-dev — dev-сервер

**Frontend**
- React + TypeScript
- Vite
- Redux Toolkit + RTK Query
- React Router
- SCSS-модули

**Инфраструктура**
- Docker / docker-compose
- nginx (reverse proxy)

## Структура проекта

```
web-larek-express/
├── backend/       # REST API на Express + MongoDB
│   ├── public/    # статика (картинки товаров)
│   ├── src/       # исходники
│   └── ...
├── frontend/      # SPA на React + Vite
│   ├── src/
│   └── ...
├── nginx/         # конфигурация nginx
├── docker-compose.yml
└── README.md
```

## Требования

- Node.js 18+ (рекомендуется 20 LTS)
- npm 9+
- MongoDB 6+ (локально или в Docker)

## Запуск

### 1. MongoDB

Убедись, что MongoDB запущена и доступна по адресу:

```
mongodb://127.0.0.1:27017
```

Если MongoDB не установлена локально — можно поднять её в Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:6
```

### 2. Backend

```bash
cd backend
npm install
```

Создай `.env` в папке `backend/` (шаблон — `.env.example`):

```env
PORT=3000
DB_ADDRESS=mongodb://127.0.0.1:27017/weblarek
AUTH_ACCESS_TOKEN_EXPIRY=15m
AUTH_REFRESH_TOKEN_EXPIRY=7d
```

Запуск dev-сервера:

```bash
npm run dev
```

Сервер поднимется на **http://localhost:3000**.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на **http://localhost:5173**.

### 4. Всё вместе через Docker (опционально)

Из корня проекта:

```bash
docker-compose up --build
```

## API (кратко)

| Метод | Роут                   | Описание                            | Auth |
|-------|------------------------|-------------------------------------|------|
| POST  | `/auth/register`       | Регистрация                         | —    |
| POST  | `/auth/login`          | Логин (устанавливает refresh-cookie)| —    |
| POST  | `/auth/refresh`        | Обновление access-токена            | 🍪   |
| POST  | `/auth/logout`         | Выход                               | 🍪   |
| GET   | `/auth/me`             | Текущий пользователь                | 🔑   |
| GET   | `/product`             | Список товаров                      | —    |
| POST  | `/product`             | Создать товар                       | 🔑   |
| PATCH | `/product/:productId`  | Обновить товар                      | 🔑   |
| DELETE| `/product/:productId`  | Удалить товар                       | 🔑   |
| POST  | `/order`               | Оформить заказ                      | —    |
| POST  | `/upload`              | Загрузить изображение товара        | 🔑   |

- 🔑 — требуется заголовок `Authorization: Bearer <accessToken>`
- 🍪 — требуется cookie `refreshToken`

## Скрипты

### Backend (`cd backend`)

| Команда          | Что делает                          |
|------------------|-------------------------------------|
| `npm run dev`    | Запуск с hot-reload (ts-node-dev)   |
| `npm run build`  | Сборка в `dist/`                    |
| `npm run start`  | Запуск собранной версии             |
| `npm run lint`   | Проверка ESLint                     |

### Frontend (`cd frontend`)

| Команда          | Что делает                          |
|------------------|-------------------------------------|
| `npm run dev`    | Dev-сервер Vite (порт 5173)         |
| `npm run build`  | Production-сборка                   |
| `npm run preview`| Предпросмотр собранной версии       |
| `npm run lint`   | Проверка ESLint                     |

## Тестирование API вручную (curl)

Пример регистрации:

```bash
curl.exe -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '@register.json'
```

Пример логина с сохранением cookie:

```bash
curl.exe -i -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '@login.json'
```

Пример защищённого запроса с cookie и access-токеном:

```bash
curl.exe -i -b cookies.txt http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

> Локальные тестовые файлы (`register.json`, `login.json`, `cookies.txt`)
> добавлены в `.gitignore` и не должны попадать в репозиторий.

## Переменные окружения

| Переменная                  | По умолчанию                              | Описание                          |
|-----------------------------|-------------------------------------------|-----------------------------------|
| `PORT`                      | `3000`                                    | Порт backend-сервера              |
| `DB_ADDRESS`                | `mongodb://127.0.0.1:27017/weblarek`      | Строка подключения к MongoDB      |
| `AUTH_ACCESS_TOKEN_EXPIRY`  | `15m`                                     | Время жизни access-токена         |
| `AUTH_REFRESH_TOKEN_EXPIRY` | `7d`                                      | Время жизни refresh-токена        |

## Лицензия

Учебный проект. Лицензия не указана.