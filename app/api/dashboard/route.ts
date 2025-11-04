import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkUserPermissionByName } from '@/app/generated-queries/rbac_sql';
import { countUsers, countRoles, countPermissions, getRecentActivities } from '@/app/generated-queries/dashboard_sql';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result: {
            usersCount?: number;
            rolesCount?: number;
            permissionsCount?: number;
            recentActivities?: any[];
        } = {};

        // Check and fetch users count
        const hasUsersCountPermission = await checkUserPermissionByName(db, {
            userId: user.id,
            name: 'dashboard:users_count',
        });

        if (hasUsersCountPermission?.hasPermission) {
            const usersCountResult = await countUsers(db);
            result.usersCount = usersCountResult ? parseInt(usersCountResult.count, 10) : 0;
        }

        // Check and fetch roles count
        const hasRolesCountPermission = await checkUserPermissionByName(db, {
            userId: user.id,
            name: 'dashboard:roles_count',
        });

        if (hasRolesCountPermission?.hasPermission) {
            const rolesCountResult = await countRoles(db);
            result.rolesCount = rolesCountResult ? parseInt(rolesCountResult.count, 10) : 0;
        }

        // Check and fetch permissions count
        const hasPermissionsCountPermission = await checkUserPermissionByName(db, {
            userId: user.id,
            name: 'dashboard:permissions_count',
        });

        if (hasPermissionsCountPermission?.hasPermission) {
            const permissionsCountResult = await countPermissions(db);
            result.permissionsCount = permissionsCountResult ? parseInt(permissionsCountResult.count, 10) : 0;
        }

        // Check and fetch recent activities
        const hasRecentActivityPermission = await checkUserPermissionByName(db, {
            userId: user.id,
            name: 'dashboard:recent_activity',
        });

        if (hasRecentActivityPermission?.hasPermission) {
            const activities = await getRecentActivities(db, { limit: '10' });
            result.recentActivities = activities.map(activity => ({
                id: activity.id,
                userId: activity.userId,
                action: activity.action,
                resourceType: activity.resourceType,
                resourceId: activity.resourceId,
                description: activity.description,
                metadata: activity.metadata,
                createdAt: activity.createdAt,
                userName: activity.userName,
                userEmail: activity.userEmail,
            }));
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

