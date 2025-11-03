-- RBAC (Role-Based Access Control) Schema
-- Supports AWS CloudFormation/IAM-style wildcard permissions

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
-- Permission format: "resource:action" (e.g., "users:read", "users:*", "*:read", "*:*")
-- Supports wildcards:
--   - "resource:*" - all actions on a specific resource
--   - "*:action" - specific action on all resources
--   - "*:*" - all actions on all resources
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure name matches resource:action format
    CONSTRAINT permissions_name_format CHECK (name = resource || ':' || action)
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_deleted_at ON user_roles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- Function to check if a permission matches a pattern (supports wildcards)
-- This function checks if a permission string matches a pattern that may contain wildcards
CREATE OR REPLACE FUNCTION permission_matches(pattern TEXT, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    pattern_parts TEXT[];
    permission_parts TEXT[];
BEGIN
    -- Split pattern and permission by ':'
    pattern_parts := string_to_array(pattern, ':');
    permission_parts := string_to_array(permission, ':');

    -- Both must have exactly 2 parts (resource:action)
    IF array_length(pattern_parts, 1) != 2 OR array_length(permission_parts, 1) != 2 THEN
        RETURN FALSE;
    END IF;

    -- Check resource match (supports '*' wildcard)
    IF pattern_parts[1] != '*' AND pattern_parts[1] != permission_parts[1] THEN
        RETURN FALSE;
    END IF;

    -- Check action match (supports '*' wildcard)
    IF pattern_parts[2] != '*' AND pattern_parts[2] != permission_parts[2] THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user has permission (supports wildcard matching)
-- Checks if user has a specific permission directly or through wildcard permissions
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param UUID, required_resource TEXT, required_action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    required_permission TEXT;
    has_perm BOOLEAN;
BEGIN
    required_permission := required_resource || ':' || required_action;

    -- Check if user has the exact permission or a matching wildcard permission
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_id_param
          AND ur.deleted_at IS NULL
          AND (
              -- Exact match
              p.name = required_permission
              OR
              -- Wildcard match: resource:* matches all actions on resource
              (p.resource = required_resource AND p.action = '*')
              OR
              -- Wildcard match: *:action matches action on all resources
              (p.resource = '*' AND p.action = required_action)
              OR
              -- Wildcard match: *:* matches everything
              (p.resource = '*' AND p.action = '*')
          )
    ) INTO has_perm;

    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

