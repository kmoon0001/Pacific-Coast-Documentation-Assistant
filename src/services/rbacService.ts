import { logger } from '../lib/logger';
import { UserRole } from './userService';

export type Permission = 
  | 'read:notes'
  | 'create:notes'
  | 'edit:notes'
  | 'delete:notes'
  | 'export:notes'
  | 'import:notes'
  | 'manage:users'
  | 'view:analytics'
  | 'view:audit'
  | 'manage:settings';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export class RBACService {
  private rolePermissions: Map<UserRole, Permission[]> = new Map([
    [
      'admin',
      [
        'read:notes',
        'create:notes',
        'edit:notes',
        'delete:notes',
        'export:notes',
        'import:notes',
        'manage:users',
        'view:analytics',
        'view:audit',
        'manage:settings',
      ],
    ],
    [
      'manager',
      [
        'read:notes',
        'create:notes',
        'edit:notes',
        'export:notes',
        'import:notes',
        'view:analytics',
        'view:audit',
      ],
    ],
    [
      'therapist',
      ['read:notes', 'create:notes', 'edit:notes', 'export:notes'],
    ],
    ['viewer', ['read:notes', 'view:analytics']],
    ['auditor', ['read:notes', 'view:audit', 'view:analytics']],
  ]);

  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.rolePermissions.get(role) || [];
    return permissions.includes(permission);
  }

  canReadNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'read:notes');
  }

  canCreateNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'create:notes');
  }

  canEditNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'edit:notes');
  }

  canDeleteNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'delete:notes');
  }

  canExportNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'export:notes');
  }

  canImportNotes(role: UserRole): boolean {
    return this.hasPermission(role, 'import:notes');
  }

  canManageUsers(role: UserRole): boolean {
    return this.hasPermission(role, 'manage:users');
  }

  canViewAnalytics(role: UserRole): boolean {
    return this.hasPermission(role, 'view:analytics');
  }

  canViewAudit(role: UserRole): boolean {
    return this.hasPermission(role, 'view:audit');
  }

  canManageSettings(role: UserRole): boolean {
    return this.hasPermission(role, 'manage:settings');
  }

  getPermissions(role: UserRole): Permission[] {
    return this.rolePermissions.get(role) || [];
  }

  getAllRoles(): UserRole[] {
    return Array.from(this.rolePermissions.keys());
  }

  getRolePermissions(): RolePermissions[] {
    return Array.from(this.rolePermissions.entries()).map(([role, permissions]) => ({
      role,
      permissions,
    }));
  }

  authorize(role: UserRole, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      logger.warn({ role, permission }, 'Authorization denied');
      throw new Error(`Role ${role} does not have permission ${permission}`);
    }
  }
}

export const rbacService = new RBACService();
