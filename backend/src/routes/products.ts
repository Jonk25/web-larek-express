import { Router } from 'express';
import {
  createProduct, deleteProduct, getProducts, updateProduct,
} from '../controllers/products';
import auth from '../middlewares/auth';
import {
  validateObjId, validateProductBody, validateProductUpdateBody,
} from '../validation';

const router = Router();

router.get('/', getProducts);
router.post('/', auth, validateProductBody, createProduct);
router.patch('/:productId', auth, validateObjId, validateProductUpdateBody, updateProduct);
router.delete('/:productId', auth, validateObjId, deleteProduct);

export default router;
