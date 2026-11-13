import type { Task, CreateTaskInput, UpdateTaskInput } from '../domain/task.js';
import type { TaskRepository } from '../infrastructure/repositories/task.repository.js';
import { TaskEntity } from '../domain/task.js';

export class TaskUseCases {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const sanitized = TaskEntity.validate(input);
    return this.taskRepository.create(sanitized);
  }

  async list(): Promise<Task[]> {
    return this.taskRepository.list();
  }

  async getById(id: number): Promise<Task | null> {
    return this.taskRepository.getById(id);
  }

  async updateById(id: number, input: UpdateTaskInput): Promise<Task | null> {
    const sanitized = TaskEntity.validateUpdate(input);
    return this.taskRepository.updateById(id, sanitized);
  }

  async deleteById(id: number): Promise<boolean> {
    return this.taskRepository.deleteById(id);
  }
}
