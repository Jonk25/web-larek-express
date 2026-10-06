import winston from 'winston';
import expressWinston from 'express-winston';

// логгер запросов: каждый входящий запрос — строка в request.log
const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: 'request.log' }),
  ],
  format: winston.format.json(),
});

// логгер ошибок: всё, что дошло до обработки как ошибка — в error.log
const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
  ],
  format: winston.format.json(),
});

export {
  requestLogger,
  errorLogger,
};
