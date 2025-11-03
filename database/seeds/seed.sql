-- Database Seeder
-- This script seeds the database with initial data for development and testing

-- Seed users
-- Passwords are bcrypt hashed (cost factor 10)
-- admin@vistra.com: admin123
-- user@vistra.com: user123
-- demo@vistra.com: demo123
INSERT INTO users (id, email, name, password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@vistra.com', 'Admin User', '$2b$10$pnq7kiSMnuDZLts/7bhERejig4oJ4.vwJTIsnlBzS5yJzWDZ0JtEu', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'user@vistra.com', 'Regular User', '$2b$10$0ea2HKUVzr9HkWgF/GVOUe1PufAFbCjEjSFB67e5VaW3VVjuxL2By', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'demo@vistra.com', 'Demo User', '$2b$10$S6.fiNj/RNfO34mH1rO4xuLRr3f0s4u6fvn5A3n2kAd/7lmhxhq5W', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Seed roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full access', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'user', 'Regular user with limited access', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'viewer', 'Read-only access', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

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
  ('20000000-0000-0000-0000-000000000010', 'permissions:*', 'permissions', '*', 'All actions on permissions', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin role gets full access
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- User role gets user read and write permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Viewer role gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Assign roles to users
-- Admin user gets admin role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Regular user gets user role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', NOW(), '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Demo user gets viewer role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', NOW(), '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

