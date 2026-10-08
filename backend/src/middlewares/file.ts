import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const { UPLOAD_PATH_TEMP = 'temp' } = process.env;

fs.mkdirSync(UPLOAD_PATH_TEMP, { recursive: true }); // папка обязана существовать

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_PATH_TEMP),
  // уникальное (не пользовательское!) имя: uuid + расширение
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) return cb(null, true);
  return cb(new Error('Недопустимый тип файла'));
};

const fileMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // лимит 10 МБ
});

export default fileMiddleware;
