import { Router } from 'express';
import { createProduct, getProducts } from '../controllers/products';
import { validateProductBody } from '../validation';

const router = Router();

router.get('/', getProducts);
router.post('/', validateProductBody, createProduct);

export default router;
