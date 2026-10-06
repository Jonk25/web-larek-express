import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';

const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'На сервере произошла ошибка';

  if (err instanceof MongooseError.ValidationError
    || err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = 'Ошибка валидации данных';
  }

  if (err instanceof Error && err.message.includes('E11000')) {
    statusCode = 409;
    message = 'Товар с таким заголовком уже существует';
  }

  res.status(statusCode).send({ message });
};

export default errorHandler;
