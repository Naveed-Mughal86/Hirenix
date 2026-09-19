// src/modules/auth/auth.service.ts
import { hashPassword, verifyPassword } from '../../shared/password';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import { findUserByEmail, createUser } from './auth.repo';
import type { RegisterInput, LoginInput } from './auth.schema';

// A pre-computed bcrypt hash of a throwaway string.
// Used in the login path when no user is found, so the timing cost of
// bcrypt.compare is always paid regardless of whether the email exists.
// Generate with: node -e "require('bcryptjs').hash('__dummy__',12).then(console.log)"
const DUMMY_HASH =
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zLklGLsR9XFKQZ5kQlbri';

export async function register(
  input: RegisterInput,
): Promise<{ id: string; email: string; role: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('Email already taken');
  }

  const passwordHash = await hashPassword(input.password);
  return createUser(input.email, passwordHash, input.role);
}

export async function login(
  input: LoginInput,
): Promise<{ id: string; email: string; role: string }> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    // Always call verifyPassword, even with a dummy hash.
    // Without this call, a timing oracle exists: no-user paths return in ~0ms,
    // found-but-wrong-password paths return in ~250ms. An attacker measuring
    // response times can determine which emails are registered despite receiving
    // the same error message in both cases.
    await verifyPassword(input.password, DUMMY_HASH);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('Account suspended');
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Chapter 21 adds token issuance here.
  // The return value expands to { id, email, role, accessToken }.
  return { id: user.id, email: user.email, role: user.role };
}