export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export type UpdateTaskInput = Partial<Pick<CreateTaskInput, 'title' | 'description' | 'status' | 'priority'>>;

export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const UPDATEABLE_TASK_FIELDS = ['title', 'description', 'status', 'priority'];

export class TaskEntity {
  static validate(input: CreateTaskInput): Required<CreateTaskInput> {
    const title = this.validateTitle(input.title);
    const description = this.validateDescription(input.description);
    const status = this.validateStatus(input.status ?? 'PENDING');
    const priority = this.validatePriority(input.priority ?? 'MEDIUM');

    return {
      title,
      description,
      status,
      priority
    };
  }

  static validateUpdate(input: UpdateTaskInput): UpdateTaskInput {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('O corpo da requisição deve ser um objeto.');
    }

    const fields = Object.keys(input);

    if (fields.length === 0) {
      throw new Error('Informe ao menos um campo para atualizar.');
    }

    const invalidField = fields.find((field) => !UPDATEABLE_TASK_FIELDS.includes(field));

    if (invalidField) {
      throw new Error(`Campo inválido para atualização: ${invalidField}.`);
    }

    const update: UpdateTaskInput = {};

    if (Object.prototype.hasOwnProperty.call(input, 'title')) {
      update.title = this.validateTitle(input.title);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'description')) {
      update.description = this.validateDescription(input.description);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'status')) {
      update.status = this.validateStatus(input.status);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'priority')) {
      update.priority = this.validatePriority(input.priority);
    }

    return update;
  }

  private static validateTitle(value: unknown): string {
    const title = typeof value === 'string' ? value.trim() : '';

    if (!title || title.length < 3) {
      throw new Error('O título é obrigatório e deve ter ao menos 3 caracteres.');
    }

    if (title.length > 255) {
      throw new Error('O título deve ter no máximo 255 caracteres.');
    }

    return title;
  }

  private static validateDescription(value: unknown): string {
    const description = typeof value === 'string' ? value.trim() : '';

    if (!description || description.length < 5) {
      throw new Error('A descrição é obrigatória e deve ter ao menos 5 caracteres.');
    }

    return description;
  }

  private static validateStatus(value: unknown): TaskStatus {
    if (!TASK_STATUSES.includes(value as TaskStatus)) {
      throw new Error(`Status inválido: ${value}.`);
    }

    return value as TaskStatus;
  }

  private static validatePriority(value: unknown): TaskPriority {
    if (!TASK_PRIORITIES.includes(value as TaskPriority)) {
      throw new Error(`Prioridade inválida: ${value}.`);
    }

    return value as TaskPriority;
  }
}
