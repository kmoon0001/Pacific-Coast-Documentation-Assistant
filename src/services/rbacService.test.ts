import { describe, it, expect } from 'vitest';
import { RBACService } from './rbacService';

describe('RBACService', () => {
  const service = new RBACService();

  describe('hasPermission', () => {
    it('should grant admin all permissions', () => {
      expect(service.hasPermission('admin', 'read:notes')).toBe(true);
      expect(service.hasPermission('admin', 'create:notes')).toBe(true);
      expect(service.hasPermission('admin', 'delete:notes')).toBe(true);
      expect(service.hasPermission('admin', 'manage:users')).toBe(true);
      expect(service.hasPermission('admin', 'manage:settings')).toBe(true);
    });

    it('should grant manager appropriate permissions', () => {
      expect(service.hasPermission('manager', 'read:notes')).toBe(true);
      expect(service.hasPermission('manager', 'create:notes')).toBe(true);
      expect(service.hasPermission('manager', 'edit:notes')).toBe(true);
      expect(service.hasPermission('manager', 'manage:users')).toBe(false);
      expect(service.hasPermission('manager', 'manage:settings')).toBe(false);
    });

    it('should grant therapist appropriate permissions', () => {
      expect(service.hasPermission('therapist', 'read:notes')).toBe(true);
      expect(service.hasPermission('therapist', 'create:notes')).toBe(true);
      expect(service.hasPermission('therapist', 'edit:notes')).toBe(true);
      expect(service.hasPermission('therapist', 'delete:notes')).toBe(false);
      expect(service.hasPermission('therapist', 'manage:users')).toBe(false);
    });

    it('should grant viewer limited permissions', () => {
      expect(service.hasPermission('viewer', 'read:notes')).toBe(true);
      expect(service.hasPermission('viewer', 'create:notes')).toBe(false);
      expect(service.hasPermission('viewer', 'edit:notes')).toBe(false);
      expect(service.hasPermission('viewer', 'view:analytics')).toBe(true);
    });

    it('should grant auditor audit permissions', () => {
      expect(service.hasPermission('auditor', 'read:notes')).toBe(true);
      expect(service.hasPermission('auditor', 'view:audit')).toBe(true);
      expect(service.hasPermission('auditor', 'view:analytics')).toBe(true);
      expect(service.hasPermission('auditor', 'create:notes')).toBe(false);
    });
  });

  describe('specific permission checks', () => {
    it('should check read permission', () => {
      expect(service.canReadNotes('admin')).toBe(true);
      expect(service.canReadNotes('therapist')).toBe(true);
      expect(service.canReadNotes('viewer')).toBe(true);
    });

    it('should check create permission', () => {
      expect(service.canCreateNotes('admin')).toBe(true);
      expect(service.canCreateNotes('therapist')).toBe(true);
      expect(service.canCreateNotes('viewer')).toBe(false);
    });

    it('should check edit permission', () => {
      expect(service.canEditNotes('admin')).toBe(true);
      expect(service.canEditNotes('manager')).toBe(true);
      expect(service.canEditNotes('viewer')).toBe(false);
    });

    it('should check delete permission', () => {
      expect(service.canDeleteNotes('admin')).toBe(true);
      expect(service.canDeleteNotes('therapist')).toBe(false);
    });

    it('should check export permission', () => {
      expect(service.canExportNotes('admin')).toBe(true);
      expect(service.canExportNotes('therapist')).toBe(true);
      expect(service.canExportNotes('viewer')).toBe(false);
    });

    it('should check import permission', () => {
      expect(service.canImportNotes('admin')).toBe(true);
      expect(service.canImportNotes('manager')).toBe(true);
      expect(service.canImportNotes('therapist')).toBe(false);
    });

    it('should check user management permission', () => {
      expect(service.canManageUsers('admin')).toBe(true);
      expect(service.canManageUsers('manager')).toBe(false);
    });

    it('should check analytics permission', () => {
      expect(service.canViewAnalytics('admin')).toBe(true);
      expect(service.canViewAnalytics('manager')).toBe(true);
      expect(service.canViewAnalytics('viewer')).toBe(true);
      expect(service.canViewAnalytics('therapist')).toBe(false);
    });

    it('should check audit permission', () => {
      expect(service.canViewAudit('admin')).toBe(true);
      expect(service.canViewAudit('auditor')).toBe(true);
      expect(service.canViewAudit('therapist')).toBe(false);
    });

    it('should check settings permission', () => {
      expect(service.canManageSettings('admin')).toBe(true);
      expect(service.canManageSettings('manager')).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for admin', () => {
      const permissions = service.getPermissions('admin');
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain('manage:users');
      expect(permissions).toContain('manage:settings');
    });

    it('should return limited permissions for viewer', () => {
      const permissions = service.getPermissions('viewer');
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain('read:notes');
      expect(permissions).not.toContain('delete:notes');
    });

    it('should return empty array for unknown role', () => {
      const permissions = service.getPermissions('unknown' as any);
      expect(permissions).toEqual([]);
    });
  });

  describe('getAllRoles', () => {
    it('should return all defined roles', () => {
      const roles = service.getAllRoles();
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('therapist');
      expect(roles).toContain('viewer');
      expect(roles).toContain('auditor');
    });

    it('should return exactly 5 roles', () => {
      const roles = service.getAllRoles();
      expect(roles).toHaveLength(5);
    });
  });

  describe('getRolePermissions', () => {
    it('should return role-permission mappings', () => {
      const mappings = service.getRolePermissions();
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.every(m => m.role && Array.isArray(m.permissions))).toBe(true);
    });

    it('should include all roles', () => {
      const mappings = service.getRolePermissions();
      const roles = mappings.map(m => m.role);
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('therapist');
      expect(roles).toContain('viewer');
      expect(roles).toContain('auditor');
    });
  });

  describe('authorize', () => {
    it('should authorize when permission exists', () => {
      expect(() => {
        service.authorize('admin', 'manage:users');
      }).not.toThrow();
    });

    it('should throw when permission denied', () => {
      expect(() => {
        service.authorize('therapist', 'manage:users');
      }).toThrow('does not have permission');
    });

    it('should throw for viewer creating notes', () => {
      expect(() => {
        service.authorize('viewer', 'create:notes');
      }).toThrow();
    });

    it('should allow therapist to create notes', () => {
      expect(() => {
        service.authorize('therapist', 'create:notes');
      }).not.toThrow();
    });
  });

  describe('permission hierarchy', () => {
    it('admin should have all permissions', () => {
      const adminPerms = service.getPermissions('admin');
      const allRoles = service.getAllRoles();

      allRoles.forEach(role => {
        const rolePerms = service.getPermissions(role);
        rolePerms.forEach(perm => {
          expect(adminPerms).toContain(perm);
        });
      });
    });

    it('therapist should have subset of manager permissions', () => {
      const therapistPerms = service.getPermissions('therapist');
      const managerPerms = service.getPermissions('manager');

      therapistPerms.forEach(perm => {
        expect(managerPerms).toContain(perm);
      });
    });
  });
});
