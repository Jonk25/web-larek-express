import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UnauthorizedError from '../errors/unauthorized-error';

const { AUTH_JWT_SECRET = 'super-strong-secret' } = process.env;

export interface SessionRequest extends Request {
  user?: JwtPayload | string;
}

export default (req: SessionRequest, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Необходима авторизация'));
  }
  const token = authorization.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, AUTH_JWT_SECRET);
  } catch {
    return next(new UnauthorizedError('Необходима авторизация'));
  }
  return next();
};
