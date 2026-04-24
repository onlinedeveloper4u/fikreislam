'use server'

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail } from '@/lib/brevo';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

function isSuperAdmin(role: string) {
  return role === 'owner';
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      ...payload,
      isSuperAdmin: isSuperAdmin(payload.role as string)
    }; // { userId, email, role, fullName, isSuperAdmin }
  } catch (error) {
    return null;
  }
}

async function setSessionCookie(user: any) {
  // Ensure we have plain values even if user is a Mongoose document
  const userId = user._id ? user._id.toString() : user.id;
  const email = user.email;
  const role = user.role;
  const fullName = user.fullName || user.full_name || '';

  const token = await new SignJWT({
    userId,
    email,
    role,
    fullName
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

    await setSessionCookie(user);

    return { 
      session: { 
        user: { 
          id: user._id.toString(), 
          email: user.email, 
          fullName: user.fullName,
          role: user.role
        } 
      }, 
      error: null 
    };
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

    await setSessionCookie(user);

    return { 
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        fullName: user.fullName,
        role: user.role,
        isSuperAdmin: isSuperAdmin(user.role)
      },
      error: null 
    };
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

export async function updateUserRole(userId: string, newRole: 'owner' | 'admin' | 'user') {
  await dbConnect();
  try {
    const session = await getUserSession() as any;
    if (!session || !isSuperAdmin(session.role as string)) {
      return { error: new Error('صرف سپر ایڈمن کردار تبدیل کر سکتا ہے') };
    }

    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
    return { data: user, error: null };
  } catch (error: any) {
    return { error };
  }
}

export async function sendPasswordResetEmail(email: string) {
  await dbConnect();
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      // Don't reveal if user exists for security, just return success
      return { success: true };
    }

    // Generate a temporary reset token (in a real app, save this to DB)
    const resetToken = Buffer.from(`${user._id}-${Date.now()}`).toString('base64');
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="direction: rtl; font-family: sans-serif; text-align: right; padding: 20px;">
        <h1 style="color: #065f46;">فکرِ اسلام - پاس ورڈ ری سیٹ</h1>
        <p>السلام علیکم محترم ${user.fullName}،</p>
        <p>آپ کے اکاؤنٹ کا پاس ورڈ لنک موصول ہوا ہے۔ پاس ورڈ تبدیل کرنے کے لیے نیچے دیے گئے بٹن پر کلک کریں:</p>
        <a href="${resetLink}" style="display: inline-block; background: #065f46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">پاس ورڈ تبدیل کریں</a>
        <p>اگر آپ نے یہ درخواست نہیں کی تو اس ای میل کو نظر انداز کریں۔</p>
      </div>
    `;

    const result = await sendEmail({
      to: [{ email: user.email, name: user.fullName }],
      subject: 'فکرِ اسلام - پاس ورڈ ری سیٹ کی درخواست',
      htmlContent
    });

    return result;
  } catch (error: any) {
    return { error };
  }
}

export async function resetPassword(token: string, newPasswordHash: string) {
  await dbConnect();
  try {
    // Decode the token (Base64) to get userId
    const decoded = Buffer.from(token, 'base64').toString();
    const [userId, timestamp] = decoded.split('-');

    // Check if token is too old (e.g., 1 hour)
    const tokenTime = parseInt(timestamp);
    if (Date.now() - tokenTime > 3600000) {
      return { error: new Error('Token expired') };
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPasswordHash, salt);

    const user = await User.findByIdAndUpdate(userId, { passwordHash: hashed }, { new: true });
    if (!user) {
      return { error: new Error('User not found') };
    }

    return { success: true };
  } catch (error: any) {
    return { error };
  }
}

export async function updateProfile(data: { fullName?: string, password?: string }) {
  await dbConnect();
  try {
    const session = await getUserSession() as any;
    if (!session || !session.userId) {
      return { error: new Error('Unauthorized') };
    }

    const updates: any = {};
    if (data.fullName) updates.fullName = data.fullName;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(data.password, salt);
    }

    const user = await User.findByIdAndUpdate(session.userId, updates, { new: true });
    if (!user) {
      return { error: new Error('User not found') };
    }

    // Re-issue session cookie with new data (e.g. updated fullName)
    await setSessionCookie(user);

    return { success: true, data: { fullName: user.fullName } };
  } catch (error: any) {
    return { error };
  }
}
