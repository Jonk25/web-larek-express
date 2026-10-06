import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';

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

  return Product.create({
    description,
    image,
    title,
    category,
    price,
  })
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
