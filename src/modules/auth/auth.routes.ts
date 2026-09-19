// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { validateBody } from '../../shared/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { register, login } from './auth.service';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const body = validateBody(registerSchema, req.body);
    const user = await register(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = validateBody(loginSchema, req.body);
    const user = await login(body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };