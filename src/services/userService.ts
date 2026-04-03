import { z } from 'zod';
import { logger } from '../lib/logger';

export type UserRole = 'admin' | 'manager' | 'therapist' | 'viewer' | 'auditor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  department?: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'therapist', 'viewer', 'auditor']),
  department: z.string().optional(),
});

export class UserService {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map();

  createUser(input: CreateUserInput): User {
    UserSchema.parse(input);

    if (this.emailIndex.has(input.email)) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    const id = this.generateId();
    const user: User = {
      id,
      email: input.email,
      name: input.name,
      role: input.role,
      active: true,
      createdAt: new Date(),
      department: input.department,
    };

    this.users.set(id, user);
    this.emailIndex.set(input.email, id);

    logger.info({ userId: id, email: input.email }, 'User created');
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const id = this.emailIndex.get(email);
    return id ? this.users.get(id) : undefined;
  }

  updateUser(id: string, updates: Partial<CreateUserInput>): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    if (updates.email && updates.email !== user.email) {
      if (this.emailIndex.has(updates.email)) {
        throw new Error(`Email ${updates.email} already in use`);
      }
      this.emailIndex.delete(user.email);
      this.emailIndex.set(updates.email, id);
    }

    const updated: User = {
      ...user,
      ...updates,
    };

    this.users.set(id, updated);
    logger.info({ userId: id }, 'User updated');
    return updated;
  }

  deleteUser(id: string): void {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    this.users.delete(id);
    this.emailIndex.delete(user.email);
    logger.info({ userId: id }, 'User deleted');
  }

  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  listUsersByRole(role: UserRole): User[] {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  deactivateUser(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    const updated: User = { ...user, active: false };
    this.users.set(id, updated);
    logger.info({ userId: id }, 'User deactivated');
    return updated;
  }

  activateUser(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    const updated: User = { ...user, active: true };
    this.users.set(id, updated);
    logger.info({ userId: id }, 'User activated');
    return updated;
  }

  recordLogin(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    const updated: User = { ...user, lastLogin: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  private generateId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const userService = new UserService();
