import { describe, expect, it, vi } from 'vitest';
import { TaskUseCases } from '../../src/application/task-usecases.js';

describe('TaskUseCases', () => {
  it('creates a task through the repository', async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: 1,
        title: 'Nova tarefa',
        description: 'Descrição válida',
        status: 'PENDING',
        priority: 'LOW',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      }),
      list: vi.fn(),
      getById: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn()
    };

    const useCases = new TaskUseCases(repository as any);
    const item = await useCases.create({
      title: 'Nova tarefa',
      description: 'Descrição válida',
      status: 'PENDING',
      priority: 'LOW'
    });

    expect(repository.create).toHaveBeenCalled();
    expect(item.title).toBe('Nova tarefa');
  });

  it('lists tasks from the repository', async () => {
    const repository = {
      create: vi.fn(),
      list: vi.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Task listada',
          description: 'Descrição da lista',
          status: 'PENDING',
          priority: 'MEDIUM',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z')
        }
      ]),
      getById: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn()
    };

    const useCases = new TaskUseCases(repository as any);
    const result = await useCases.list();

    expect(repository.list).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('gets a task by id from the repository', async () => {
    const repository = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn().mockResolvedValue({
        id: 2,
        title: 'Task por id',
        description: 'Descrição por id',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      }),
      updateById: vi.fn(),
      deleteById: vi.fn()
    };

    const useCases = new TaskUseCases(repository as any);
    const result = await useCases.getById(2);

    expect(repository.getById).toHaveBeenCalledWith(2);
    expect(result?.title).toBe('Task por id');
  });

  it('validates and forwards only supplied update fields', async () => {
    const repository = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      updateById: vi.fn().mockResolvedValue({
        id: 2,
        title: 'Task por id',
        description: 'Descrição por id',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z')
      }),
      deleteById: vi.fn()
    };

    const useCases = new TaskUseCases(repository as any);
    const result = await useCases.updateById(2, { title: '  Task por id  ' });

    expect(repository.updateById).toHaveBeenCalledWith(2, { title: 'Task por id' });
    expect(result?.title).toBe('Task por id');
  });

  it('deletes a task by id through the repository', async () => {
    const repository = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(true)
    };

    const useCases = new TaskUseCases(repository as any);

    await expect(useCases.deleteById(2)).resolves.toBe(true);
    expect(repository.deleteById).toHaveBeenCalledWith(2);
  });
});
