'use server'

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload; // { userId, email, role, fullName }
  } catch (error) {
    return null;
  }
}

export async function signUp(email: string, passwordHash: string, fullName: string) {
  await dbConnect();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { session: null, error: new Error('User already exists') };
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordHash, salt);

    const user = await User.create({
      email,
      passwordHash: hashed,
      fullName,
      role: 'user'
    });

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return { session: { user: { id: user._id.toString(), email } }, error: null };
  } catch (error: any) {
    return { session: null, error };
  }
}

export async function signIn(email: string, passwordHash: string) {
  await dbConnect();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { error: new Error('Invalid credentials') };
    }

    const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
      return { error: new Error('Invalid credentials') };
    }

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getUsersWithRoles() {
  await dbConnect();
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return {
      data: users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        full_name: u.fullName,
        user_role: u.role,
        created_at: u.createdAt
      })), error: null
    };
  } catch (error: any) {
    return { error };
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  await dbConnect();
  try {
    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
    return { data: user, error: null };
  } catch (error: any) {
    return { error };
  }
}
