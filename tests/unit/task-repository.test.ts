import { describe, expect, it, vi } from 'vitest';
import { PrismaTaskRepository } from '../../src/infrastructure/repositories/task.repository.js';
import { Prisma, type PrismaClient } from '@prisma/client';

const createRepository = () => {
  const prisma = {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn()
    }
  };

  return {
    prisma,
    repository: new PrismaTaskRepository(prisma as unknown as PrismaClient)
  };
};

describe('PrismaTaskRepository', () => {
  it('creates a task with the supplied status and priority', async () => {
    const { prisma, repository } = createRepository();
    const task = {
      id: 1,
      title: 'Tarefa',
      description: 'Descrição válida',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    prisma.task.create.mockResolvedValue(task);

    await expect(repository.create({
      title: task.title,
      description: task.description,
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    })).resolves.toEqual(task);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        title: task.title,
        description: task.description,
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      }
    });
  });

  it('uses the domain defaults when optional values are omitted', async () => {
    const { prisma, repository } = createRepository();
    prisma.task.create.mockResolvedValue({});

    await repository.create({
      title: 'Tarefa',
      description: 'Descrição válida'
    });

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Tarefa',
        description: 'Descrição válida',
        status: 'PENDING',
        priority: 'MEDIUM'
      }
    });
  });

  it('lists tasks in descending creation order', async () => {
    const { prisma, repository } = createRepository();
    prisma.task.findMany.mockResolvedValue([]);

    await expect(repository.list()).resolves.toEqual([]);
    expect(prisma.task.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' }
    });
  });

  it('returns a task found by identifier', async () => {
    const { prisma, repository } = createRepository();
    const task = { id: 4 };
    prisma.task.findUnique.mockResolvedValue(task);

    await expect(repository.getById(4)).resolves.toEqual(task);
    expect(prisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it('returns null when the identifier is not found', async () => {
    const { prisma, repository } = createRepository();
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(repository.getById(404)).resolves.toBeNull();
  });

  it('updates only the supplied fields and returns the task', async () => {
    const { prisma, repository } = createRepository();
    const task = { id: 4, title: 'Updated title' };
    prisma.task.update.mockResolvedValue(task);

    await expect(repository.updateById(4, { title: 'Updated title' })).resolves.toEqual(task);
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { title: 'Updated title' }
    });
  });

  it('returns null when updating a task that does not exist', async () => {
    const { prisma, repository } = createRepository();
    prisma.task.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Record to update not found.',
      { code: 'P2025', clientVersion: 'test' }
    ));

    await expect(repository.updateById(404, { status: 'COMPLETED' })).resolves.toBeNull();
  });

  it('deletes a task and reports whether a row was removed', async () => {
    const { prisma, repository } = createRepository();
    prisma.task.deleteMany.mockResolvedValue({ count: 1 });

    await expect(repository.deleteById(4)).resolves.toBe(true);
    expect(prisma.task.deleteMany).toHaveBeenCalledWith({ where: { id: 4 } });

    prisma.task.deleteMany.mockResolvedValue({ count: 0 });
    await expect(repository.deleteById(404)).resolves.toBe(false);
  });
});
