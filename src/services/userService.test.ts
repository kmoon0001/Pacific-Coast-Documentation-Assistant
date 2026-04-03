import { describe, it, expect, beforeEach } from 'vitest';
import { UserService, CreateUserInput } from './userService';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('createUser', () => {
    it('should create a new user', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const user = service.createUser(input);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('therapist');
      expect(user.active).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should prevent duplicate emails', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      service.createUser(input);

      expect(() => service.createUser(input)).toThrow('already exists');
    });

    it('should support all user roles', () => {
      const roles = ['admin', 'manager', 'therapist', 'viewer', 'auditor'] as const;

      roles.forEach(role => {
        const input: CreateUserInput = {
          email: `${role}@example.com`,
          name: `${role} User`,
          role,
        };

        const user = service.createUser(input);
        expect(user.role).toBe(role);
      });
    });

    it('should support optional department', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
        department: 'Physical Therapy',
      };

      const user = service.createUser(input);
      expect(user.department).toBe('Physical Therapy');
    });

    it('should validate email format', () => {
      const input: CreateUserInput = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'therapist',
      };

      expect(() => service.createUser(input)).toThrow();
    });

    it('should require name', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: '',
        role: 'therapist',
      };

      expect(() => service.createUser(input)).toThrow();
    });
  });

  describe('getUser', () => {
    it('should retrieve user by ID', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const created = service.createUser(input);
      const retrieved = service.getUser(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent user', () => {
      const result = service.getUser('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const created = service.createUser(input);
      const retrieved = service.getUserByEmail('test@example.com');

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent email', () => {
      const result = service.getUserByEmail('nonexistent@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user information', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const created = service.createUser(input);
      const updated = service.updateUser(created.id, {
        name: 'Updated Name',
        role: 'manager',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.role).toBe('manager');
      expect(updated.email).toBe('test@example.com');
    });

    it('should update email', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const created = service.createUser(input);
      const updated = service.updateUser(created.id, {
        email: 'newemail@example.com',
      });

      expect(updated.email).toBe('newemail@example.com');
      expect(service.getUserByEmail('newemail@example.com')).toEqual(updated);
    });

    it('should prevent duplicate email updates', () => {
      const input1: CreateUserInput = {
        email: 'test1@example.com',
        name: 'User 1',
        role: 'therapist',
      };
      const input2: CreateUserInput = {
        email: 'test2@example.com',
        name: 'User 2',
        role: 'therapist',
      };

      const user1 = service.createUser(input1);
      service.createUser(input2);

      expect(() => {
        service.updateUser(user1.id, { email: 'test2@example.com' });
      }).toThrow('already in use');
    });

    it('should throw for non-existent user', () => {
      expect(() => {
        service.updateUser('non-existent-id', { name: 'New Name' });
      }).toThrow('not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      };

      const created = service.createUser(input);
      service.deleteUser(created.id);

      expect(service.getUser(created.id)).toBeUndefined();
      expect(service.getUserByEmail('test@example.com')).toBeUndefined();
    });

    it('should throw for non-existent user', () => {
      expect(() => {
        service.deleteUser('non-existent-id');
      }).toThrow('not found');
    });
  });

  describe('listUsers', () => {
    it('should list all users', () => {
      const input1: CreateUserInput = {
        email: 'test1@example.com',
        name: 'User 1',
        role: 'therapist',
      };
      const input2: CreateUserInput = {
        email: 'test2@example.com',
        name: 'User 2',
        role: 'manager',
      };

      service.createUser(input1);
      service.createUser(input2);

      const users = service.listUsers();
      expect(users).toHaveLength(2);
    });

    it('should return empty array when no users', () => {
      const users = service.listUsers();
      expect(users).toEqual([]);
    });
  });

  describe('listUsersByRole', () => {
    it('should list users by role', () => {
      service.createUser({
        email: 'therapist1@example.com',
        name: 'Therapist 1',
        role: 'therapist',
      });
      service.createUser({
        email: 'therapist2@example.com',
        name: 'Therapist 2',
        role: 'therapist',
      });
      service.createUser({
        email: 'manager@example.com',
        name: 'Manager',
        role: 'manager',
      });

      const therapists = service.listUsersByRole('therapist');
      expect(therapists).toHaveLength(2);
      expect(therapists.every(u => u.role === 'therapist')).toBe(true);
    });

    it('should return empty array for role with no users', () => {
      const admins = service.listUsersByRole('admin');
      expect(admins).toEqual([]);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', () => {
      const created = service.createUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      });

      const deactivated = service.deactivateUser(created.id);
      expect(deactivated.active).toBe(false);
    });

    it('should throw for non-existent user', () => {
      expect(() => {
        service.deactivateUser('non-existent-id');
      }).toThrow('not found');
    });
  });

  describe('activateUser', () => {
    it('should activate user', () => {
      const created = service.createUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      });

      service.deactivateUser(created.id);
      const activated = service.activateUser(created.id);

      expect(activated.active).toBe(true);
    });

    it('should throw for non-existent user', () => {
      expect(() => {
        service.activateUser('non-existent-id');
      }).toThrow('not found');
    });
  });

  describe('recordLogin', () => {
    it('should record user login', () => {
      const created = service.createUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'therapist',
      });

      const before = new Date();
      const updated = service.recordLogin(created.id);
      const after = new Date();

      expect(updated.lastLogin).toBeDefined();
      expect(updated.lastLogin!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updated.lastLogin!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw for non-existent user', () => {
      expect(() => {
        service.recordLogin('non-existent-id');
      }).toThrow('not found');
    });
  });
});
