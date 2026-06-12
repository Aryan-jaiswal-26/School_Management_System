import type { Role, User, UserStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
      },
    });
  }

  updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  updateStatus(id: string, status: UserStatus): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { status },
    });
  }
}