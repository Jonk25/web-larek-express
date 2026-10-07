import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';
import NotFoundError from '../errors/not-found-error';

const { UPLOAD_PATH = 'images', UPLOAD_PATH_TEMP = 'temp' } = process.env;

// переносит файл из temp в public/images; если файла нет — не роняет запрос
const moveImageToPermanent = (image?: { fileName?: string }) => {
  if (!image?.fileName) return Promise.resolve();
  const name = path.basename(image.fileName);
  return fs.promises.rename(
    path.join(UPLOAD_PATH_TEMP, name),
    path.join(__dirname, '..', '..', 'public', UPLOAD_PATH, name),
  ).catch(() => Promise.resolve());
};

export const getProducts = (_req: Request, res: Response, next: NextFunction) => Product.find({})
  .then((items) => res.send({
    items,
    total: items.length,
  }))
  .catch(next);

export const createProduct = (req: Request, res: Response, next: NextFunction) => {
  const {
    description,
    image,
    title,
    category,
    price,
  } = req.body;

  return moveImageToPermanent(req.body.image).then(() => Product.create({
    description,
    image,
    title,
    category,
    price,
  }))
    .then((product) => res.status(201).send(product))
    .catch((error) => {
      if (error instanceof Error && error.message.includes('E11000')) {
        return next(new ConflictError('Товар с таким заголовком уже существует'));
      }
      if (error instanceof MongooseError.ValidationError) {
        return next(new BadRequestError('Ошибка валидации данных при создании товара'));
      }
      return next(error); // всё непредусмотренное — в 500
    });
};

export const updateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  return moveImageToPermanent(req.body.image)
    .then(() => Product.findByIdAndUpdate(productId, req.body, { new: true, runValidators: true })
      .orFail(() => new NotFoundError('Нет товара по заданному id')))
    .then((product) => res.send(product))
    .catch((error) => {
      if (error instanceof MongooseError.CastError) {
        return next(new BadRequestError('Передан не валидный ID товара'));
      }
      if (error instanceof Error && error.message.includes('E11000')) {
        return next(new ConflictError('Товар с таким заголовком уже существует'));
      }
      if (error instanceof MongooseError.ValidationError) {
        return next(new BadRequestError('Ошибка валидации данных при обновлении товара'));
      }
      return next(error);
    });
};

export const deleteProduct = (req: Request, res: Response, next: NextFunction) => Product
  .findByIdAndDelete(req.params.productId)
  .orFail(() => new NotFoundError('Нет товара по заданному id'))
  .then((product) => res.send(product))
  .catch((error) => {
    if (error instanceof MongooseError.CastError) {
      return next(new BadRequestError('Передан не валидный ID товара'));
    }
    return next(error);
  });
