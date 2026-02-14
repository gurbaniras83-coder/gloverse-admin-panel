'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (email === 'gurbaniras83@gmail.com' && password === 'Jagpar') {
    cookies().set('session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  }

  return {
    error: 'Invalid email or password.',
  };
}

export async function logout() {
  cookies().delete('session');
  redirect('/login');
}
