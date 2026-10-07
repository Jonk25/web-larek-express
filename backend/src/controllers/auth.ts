import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import { Error as MongooseError } from 'mongoose';
import User from '../models/user';
import BadRequestError from '../errors/bad-request-error';
import UnauthorizedError from '../errors/unauthorized-error';
import NotFoundError from '../errors/not-found-error';
import ConflictError from '../errors/conflict-error';

const { AUTH_ACCESS_TOKEN_EXPIRY = '1m', AUTH_REFRESH_TOKEN_EXPIRY = '7d' } = process.env;
const SECRET = 'super-strong-secret';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  maxAge: ms(AUTH_REFRESH_TOKEN_EXPIRY as ms.StringValue),
  path: '/',
};

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ _id: userId }, SECRET, {
    expiresIn: AUTH_ACCESS_TOKEN_EXPIRY as SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ _id: userId }, SECRET, {
    expiresIn: AUTH_REFRESH_TOKEN_EXPIRY as SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
};

const sendAuthResponse = (user: any, res: Response, statusCode = 200) => {
  const { accessToken, refreshToken } = generateTokens(user._id.toString());
  user.tokens.push({ token: refreshToken });
  return user.save().then(() => {
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(statusCode).send({
      user: { email: user.email, name: user.name },
      success: true,
      accessToken,
    });
  });
};

export const register = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  return bcrypt.hash(password, 10)
    .then((hash) => User.create({ name, email, password: hash }))
    .then((user) => sendAuthResponse(user, res, 201))
    .catch((error) => {
      if (error instanceof Error && error.message.includes('E11000')) {
        return next(new ConflictError('Пользователь с таким email уже существует'));
      }
      if (error instanceof MongooseError.ValidationError) {
        return next(new BadRequestError('Переданы некорректные данные при регистрации'));
      }
      return next(error);
    });
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  return User.findOne({ email }).select('+password +tokens')
    .then((user) => {
      if (!user) throw new UnauthorizedError('Неправильные почта или пароль');
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) throw new UnauthorizedError('Неправильные почта или пароль');
        return user.save().then(() => sendAuthResponse(user, res));
      });
    })
    .catch(next);
};

export const getCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Необходима авторизация'));
  }
  let payload: JwtPayload;
  try {
    payload = jwt.verify(authHeader.replace('Bearer ', ''), SECRET) as JwtPayload;
  } catch {
    return next(new UnauthorizedError('Необходима авторизация'));
  }
  return User.findById(payload._id)
    .orFail(() => new NotFoundError('Пользователь по заданному id отсутствует в базе'))
    .then((user) => res.send({
      user: { email: user.email, name: user.name },
      success: true,
    }))
    .catch(next);
};

export const refreshAccessToken = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;

  // если куки вообще нет — verify упадёт, обрабатываем сразу
  if (!refreshToken) {
    return next(new UnauthorizedError('Не валидный токен'));
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, SECRET) as JwtPayload;
  } catch {
    return next(new UnauthorizedError('Не валидный токен'));
  }
  return User.findById(payload._id).select('+tokens')
    .orFail(() => new NotFoundError('Пользователь не найден'))
    .then((user) => {
      if (!user.tokens.some((t) => t.token === refreshToken)) {
        throw new UnauthorizedError('Не валидный токен');
      }

      user.tokens = user.tokens.filter((t) => t.token !== refreshToken);
      return sendAuthResponse(user, res);
    })
    .catch(next);
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, SECRET) as JwtPayload;
  } catch {
    return next(new BadRequestError('Невалидный токен'));
  }
  return User.findById(payload._id).select('+tokens')
    .orFail(() => new NotFoundError('Пользователь не найден'))
    .then((user) => {
      user.tokens = user.tokens.filter((t) => t.token !== refreshToken);
      return user.save();
    })
    .then(() => {
      res.clearCookie('refreshToken', { path: '/' });
      return res.send({ success: true });
    })
    .catch(next);
};
