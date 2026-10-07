import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { errors as celebrateErrors } from 'celebrate';
import cron from 'node-cron';
import fs from 'fs';
import productRouter from './routes/products';
import orderRouter from './routes/order';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import { requestLogger, errorLogger } from './middlewares/logger';
import NotFoundError from './errors/not-found-error';
import errorHandler from './middlewares/error-handler';

dotenv.config();

const {
  PORT = 3000,
  DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek',
  UPLOAD_PATH_TEMP = 'temp',
} = process.env;

const app = express();

mongoose.connect(DB_ADDRESS)
  .then(() => console.log('Подключено к MongoDB'))
  .catch((err) => console.error('Ошибка подключения:', err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestLogger);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/product', productRouter);
app.use('/order', orderRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);

app.use((_req, _res, next) => next(new NotFoundError('Маршрут не найден')));
app.use(errorLogger);
app.use(celebrateErrors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// каждые 10 минут удаляем файлы из temp старше часа
cron.schedule('*/10 * * * *', () => {
  fs.readdirSync(UPLOAD_PATH_TEMP).forEach((name) => {
    const file = path.join(UPLOAD_PATH_TEMP, name);
    if (Date.now() - fs.statSync(file).mtimeMs > 60 * 60 * 1000) fs.unlink(file, () => { });
  });
});
