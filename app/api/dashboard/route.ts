import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as rbacQueries from '@/lib/queries/rbac';
import * as dashboardQueries from '@/lib/queries/dashboard';
import { createSuccessResponse, createErrorResponse, ERRORS } from '@/lib/error_responses';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return createErrorResponse(ERRORS.UNAUTHORIZED);
        }

        const result: {
            usersCount?: number;
            rolesCount?: number;
            permissionsCount?: number;
            recentActivities?: any[];
        } = {};

        // Check permissions in parallel
        const [
            hasUsersCountPermission,
            hasRolesCountPermission,
            hasPermissionsCountPermission,
            hasRecentActivityPermission,
        ] = await Promise.all([
            rbacQueries.checkUserPermissionByName(user.id, 'dashboard:users_count'),
            rbacQueries.checkUserPermissionByName(user.id, 'dashboard:roles_count'),
            rbacQueries.checkUserPermissionByName(user.id, 'dashboard:permissions_count'),
            rbacQueries.checkUserPermissionByName(user.id, 'dashboard:recent_activity'),
        ]);

        // Fetch authorized data in parallel
        const fetchPromises: Promise<any>[] = [];
        const resultKeys: string[] = [];

        if (hasUsersCountPermission) {
            fetchPromises.push(dashboardQueries.countUsers());
            resultKeys.push('usersCount');
        }

        if (hasRolesCountPermission) {
            fetchPromises.push(dashboardQueries.countRoles());
            resultKeys.push('rolesCount');
        }

        if (hasPermissionsCountPermission) {
            fetchPromises.push(dashboardQueries.countPermissions());
            resultKeys.push('permissionsCount');
        }

        if (hasRecentActivityPermission) {
            fetchPromises.push(dashboardQueries.getRecentActivities(10));
            resultKeys.push('recentActivities');
        }

        const fetchResults = await Promise.all(fetchPromises);

        fetchResults.forEach((fetchResult, index) => {
            const key = resultKeys[index];
            if (key === 'recentActivities') {
                result.recentActivities = fetchResult.map((activity: any) => ({
                    id: activity.id,
                    userId: activity.userId,
                    action: activity.action,
                    resourceType: activity.resourceType,
                    resourceId: activity.resourceId,
                    description: activity.description,
                    metadata: activity.metadata,
                    createdAt: activity.createdAt,
                    userName: activity.user?.name || null,
                    userEmail: activity.user?.email || null,
                }));
            } else {
                const count = typeof fetchResult.count === 'number'
                    ? fetchResult.count
                    : parseInt(String(fetchResult.count), 10) || 0;
                if (key === 'usersCount') {
                    result.usersCount = count;
                } else if (key === 'rolesCount') {
                    result.rolesCount = count;
                } else if (key === 'permissionsCount') {
                    result.permissionsCount = count;
                }
            }
        });

        return createSuccessResponse(result);
    } catch (error) {
        logger.error('Dashboard API error', { error });
        return createErrorResponse(
            ERRORS.INTERNAL_SERVER_ERROR,
            undefined,
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        );
    }
}
