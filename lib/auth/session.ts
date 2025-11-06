/**
 * Secure session management using JWT
 * Replaces insecure JSON cookie storage
 */

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

const SESSION_COOKIE_NAME = 'vistra_session';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Create a secure JWT session token
 */
export function createSessionToken(sessionData: SessionData): string {
  const expiresIn = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // seconds

  return jwt.sign(
    {
      userId: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name,
      createdAt: sessionData.createdAt,
    },
    env.SESSION_SECRET,
    {
      expiresIn,
      issuer: 'vistra-app',
      audience: 'vistra-app',
    }
  );
}

/**
 * Verify and decode a JWT session token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, env.SESSION_SECRET, {
      issuer: 'vistra-app',
      audience: 'vistra-app',
    }) as jwt.JwtPayload;

    if (!decoded.userId || !decoded.email || !decoded.name || !decoded.createdAt) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      createdAt: decoded.createdAt,
    };
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}

/**
 * Set session cookie with JWT token
 */
export function setSessionCookie(
  response: NextResponse,
  sessionData: SessionData,
  options?: { secure?: boolean }
): void {
  const token = createSessionToken(sessionData);
  const isProduction = env.NODE_ENV === 'production';
  const secure = options?.secure ?? isProduction;

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Get session data from cookie
 */
export async function getSessionFromCookie(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

