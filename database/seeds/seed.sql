-- Database Seeder for MySQL
-- This script seeds the database with initial data for development and testing

-- Seed users
-- Passwords are bcrypt hashed (cost factor 10)
-- admin@vistra.com: admin123
-- user@vistra.com: user123
-- demo@vistra.com: demo123
INSERT INTO users (id, email, name, password, is_system_account, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@vistra.com', 'Admin User', '$2b$10$pnq7kiSMnuDZLts/7bhERejig4oJ4.vwJTIsnlBzS5yJzWDZ0JtEu', TRUE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'user@vistra.com', 'Regular User', '$2b$10$0ea2HKUVzr9HkWgF/GVOUe1PufAFbCjEjSFB67e5VaW3VVjuxL2By', FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'demo@vistra.com', 'Demo User', '$2b$10$S6.fiNj/RNfO34mH1rO4xuLRr3f0s4u6fvn5A3n2kAd/7lmhxhq5W', FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  is_system_account = VALUES(is_system_account),
  updated_at = NOW();

-- Seed roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full access', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'user', 'Regular user with limited access', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'viewer', 'Read-only access', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updated_at = NOW();

-- Seed permissions
INSERT INTO permissions (id, name, resource, action, description, created_at, updated_at) VALUES
  -- Admin permissions (full access)
  ('20000000-0000-0000-0000-000000000001', '*:*', '*', '*', 'Full access to all resources and actions', NOW(), NOW()),

  -- User management permissions
  ('20000000-0000-0000-0000-000000000002', 'users:read', 'users', 'read', 'Read user information', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000003', 'users:write', 'users', 'write', 'Create and update users', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000004', 'users:delete', 'users', 'delete', 'Delete users', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000005', 'users:*', 'users', '*', 'All actions on users', NOW(), NOW()),

  -- Role management permissions
  ('20000000-0000-0000-0000-000000000006', 'roles:read', 'roles', 'read', 'Read role information', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000007', 'roles:write', 'roles', 'write', 'Create and update roles', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000008', 'roles:*', 'roles', '*', 'All actions on roles', NOW(), NOW()),

  -- Permission management permissions
  ('20000000-0000-0000-0000-000000000009', 'permissions:read', 'permissions', 'read', 'Read permission information', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000010', 'permissions:*', 'permissions', '*', 'All actions on permissions', NOW(), NOW()),

  -- Dashboard permissions
  ('20000000-0000-0000-0000-000000000011', 'dashboard:users_count', 'dashboard', 'users_count', 'View total users count on dashboard', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000012', 'dashboard:roles_count', 'dashboard', 'roles_count', 'View total roles count on dashboard', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000013', 'dashboard:permissions_count', 'dashboard', 'permissions_count', 'View total permissions count on dashboard', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000014', 'dashboard:recent_activity', 'dashboard', 'recent_activity', 'View recent activities on dashboard', NOW(), NOW()),

  -- File management permissions
  ('20000000-0000-0000-0000-000000000015', 'files:create', 'files', 'create', 'Upload files and create folders', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000016', 'files:read', 'files', 'read', 'View files and folders', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000017', 'files:update', 'files', 'update', 'Edit file metadata and rename folders', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000018', 'files:delete', 'files', 'delete', 'Delete files and folders', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000019', 'files:download', 'files', 'download', 'Download files', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000020', 'files:share', 'files', 'share', 'Share files with other users', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000021', 'files:*', 'files', '*', 'All file operations', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  resource = VALUES(resource),
  action = VALUES(action),
  description = VALUES(description),
  updated_at = NOW();

-- Assign permissions to roles
-- Admin role gets full access
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', NOW())
ON DUPLICATE KEY UPDATE created_at = NOW();

-- User role gets user read and write permissions
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', NOW()),
  -- File management permissions for user role
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000015', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000016', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000017', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000018', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000019', NOW())
ON DUPLICATE KEY UPDATE created_at = NOW();

-- Viewer role gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009', NOW()),
  -- Dashboard read-only permissions for viewer
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000012', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000013', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000014', NOW()),
  -- File read-only permissions for viewer
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000016', NOW()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000019', NOW())
ON DUPLICATE KEY UPDATE created_at = NOW();

-- User role also gets dashboard read permissions
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000011', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000012', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000013', NOW()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000014', NOW())
ON DUPLICATE KEY UPDATE created_at = NOW();

-- Assign roles to users
-- Admin user gets admin role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001')
ON DUPLICATE KEY UPDATE
  assigned_at = NOW(),
  assigned_by = VALUES(assigned_by),
  deleted_at = NULL;

-- Regular user gets user role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', NOW(), '00000000-0000-0000-0000-000000000001')
ON DUPLICATE KEY UPDATE
  assigned_at = NOW(),
  assigned_by = VALUES(assigned_by),
  deleted_at = NULL;

-- Demo user gets viewer role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', NOW(), '00000000-0000-0000-0000-000000000001')
ON DUPLICATE KEY UPDATE
  assigned_at = NOW(),
  assigned_by = VALUES(assigned_by),
  deleted_at = NULL;
