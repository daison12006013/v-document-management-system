import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as userQueries from '@/lib/queries/users';
import { logActivity } from '@/lib/activities';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await userQueries.getUserByEmail(email);

        if (!user) {
            // Don't reveal if user exists or not (security best practice)
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create response with user data (excluding password)
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 200 }
        );

        // Set session cookie (in production, use secure, httpOnly cookies)
        // Store user information as JSON in the cookie
        const sessionData = {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: new Date().toISOString(),
        };

        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('vistra_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Log login activity
        await logActivity({
            action: 'login',
            resourceType: 'auth',
            resourceId: user.id,
            description: `User logged in: ${user.email}`,
            metadata: { email: user.email, name: user.name },
            userId: user.id,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
