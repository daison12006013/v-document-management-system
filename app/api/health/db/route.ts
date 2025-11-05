import { NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/db-init';

/**
 * GET /api/health/db
 * Check database connection health
 */
export async function GET() {
  try {
    const status = await getConnectionStatus();

    return NextResponse.json(status, {
      status: status.connected ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

