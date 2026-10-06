import { Request, Response } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';

export const createOrder = (req: Request, res: Response) => {
  const {
    payment,
    email,
    phone,
    address,
    total,
    items,
  } = req.body;

  // 1. простые проверки
  if (!payment || !['card', 'online'].includes(payment)) {
    return res.status(400).send({ message: 'Неверный способ оплаты' });
  }
  if (!email || !phone || !address) {
    return res.status(400).send({ message: 'Заполните контактные данные' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ message: 'Корзина пуста' });
  }

  // 2. проверяем товары в базе
  return Product.find({ _id: { $in: items } })
    .then((products) => {
      if (products.length !== new Set(items).size) {
        return res.status(400).send({ message: 'Один из товаров не найден' });
      }
      if (products.some((p) => p.price === null)) {
        return res.status(400).send({ message: 'Один из товаров не продаётся' });
      }
      const sum = products.reduce((acc, p) => acc + (p.price || 0), 0);
      if (sum !== total) {
        return res.status(400).send({ message: 'Сумма заказа не совпадает' });
      }

      // 3. заказ в базу НЕ пишем — просто отдаём id и total
      return res.send({ id: faker.string.uuid(), total });
    })
    .catch(() => res.status(400).send({ message: 'Некорректные данные заказа' }));
};
