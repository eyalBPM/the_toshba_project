import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserByEmail, createUser } from '@/db/user-repository';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, name } = parsed.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return ApiErrors.conflict('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUser({
      email,
      name,
      password: hashedPassword,
    });

    return apiSuccess({ id: user.id, email: user.email, name: user.name }, 201);
  } catch {
    return ApiErrors.internal();
  }
}
