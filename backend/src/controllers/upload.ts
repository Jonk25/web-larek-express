import { NextFunction, Request, Response } from 'express';
import BadRequestError from '../errors/bad-request-error';

export const uploadFile = (req: Request, _res: Response, next: NextFunction) => {
  const { file } = req;
  if (!file) return next(new BadRequestError('Файл не загружен'));
  return _res.send({
    fileName: `/images/${file.filename}`,
    originalName: file.originalname,
  });
};
