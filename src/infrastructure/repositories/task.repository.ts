import { Prisma, PrismaClient } from '@prisma/client';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/task.js';

export interface TaskRepository {
  create(data: CreateTaskInput): Promise<Task>;
  list(): Promise<Task[]>;
  getById(id: number): Promise<Task | null>;
  updateById(id: number, data: UpdateTaskInput): Promise<Task | null>;
  deleteById(id: number): Promise<boolean>;
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTaskInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status ?? 'PENDING',
        priority: data.priority ?? 'MEDIUM'
      }
    }) as Promise<Task>;
  }

  async list(): Promise<Task[]> {
    return this.prisma.task.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    }) as Promise<Task[]>;
  }

  async getById(id: number): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id }
    }) as Promise<Task | null>;
  }

  async updateById(id: number, data: UpdateTaskInput): Promise<Task | null> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data
      }) as Task;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.task.deleteMany({
      where: { id }
    });
    return result.count > 0;
  }
}
