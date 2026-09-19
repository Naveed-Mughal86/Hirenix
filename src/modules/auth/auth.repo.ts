// src/modules/auth/auth.repo.ts
import {db} from '../../shared/db';

export interface UserRow {
  id:            string;
  email:         string;
  password_hash: string;
  role:          'admin' | 'recruiter' | 'applicant';
  status:        'active' | 'inactive' | 'pending' | 'suspended';
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await db.query<UserRow>(
    'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email:        string,
  passwordHash: string,
  role:         'recruiter' | 'applicant',
): Promise<{ id: string; email: string; role: string }> {
  const { rows } = await db.query<{ id: string; email: string; role: string }>(
    `INSERT INTO users (email, password_hash, role, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING id, email, role`,
    [email, passwordHash, role],
  );

  const user = rows[0];
  if(!user){
    throw new Error('Failed to create user - no row returned from insert')
  }
  return user;
}