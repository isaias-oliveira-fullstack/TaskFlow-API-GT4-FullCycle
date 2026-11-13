import { describe, expect, it } from 'vitest';
import { TaskEntity } from '../../src/domain/task.js';

describe('TaskEntity', () => {
  it('validates and normalizes a task payload', () => {
    const task = TaskEntity.validate({
      title: '   Implementar tarefa   ',
      description: 'Descrever a funcionalidade com 5 caracteres',
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    });

    expect(task).toEqual({
      title: 'Implementar tarefa',
      description: 'Descrever a funcionalidade com 5 caracteres',
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    });
  });

  it('uses default status and priority when unspecified', () => {
    const task = TaskEntity.validate({
      title: 'Novo item',
      description: 'Descrição válida para o fluxo principal'
    });

    expect(task.status).toBe('PENDING');
    expect(task.priority).toBe('MEDIUM');
  });

  it('rejects titles shorter than three characters', () => {
    expect(() =>
      TaskEntity.validate({
        title: 'Ab',
        description: 'Descrição válida'
      })
    ).toThrow('ao menos 3 caracteres');
  });

  it('rejects titles longer than the MySQL column limit', () => {
    expect(() => TaskEntity.validate({
      title: 'T'.repeat(256),
      description: 'Descrição válida'
    })).toThrow('no máximo 255 caracteres');
    expect(() => TaskEntity.validateUpdate({
      title: 'T'.repeat(256)
    })).toThrow('no máximo 255 caracteres');
  });

  it('rejects descriptions shorter than five characters', () => {
    expect(() =>
      TaskEntity.validate({
        title: 'Título válido',
        description: 'Curs'
      })
    ).toThrow('A descrição é obrigatória');
  });

  it('rejects non-string task titles and descriptions', () => {
    expect(() => TaskEntity.validate({
      title: 123 as any,
      description: 'Descrição válida'
    })).toThrow('O título é obrigatório');
    expect(() => TaskEntity.validate({
      title: 'Título válido',
      description: null as any
    })).toThrow('A descrição é obrigatória');
  });

  it('rejects invalid status values', () => {
    expect(() =>
      TaskEntity.validate({
        title: 'Título válido',
        description: 'Descrição válida',
        status: 'READY' as any
      })
    ).toThrow('Status inválido');
  });

  it('rejects invalid priorities', () => {
    expect(() =>
      TaskEntity.validate({
        title: 'Valid title',
        description: 'Descrição válida',
        priority: 'URGENT' as any
      })
    ).toThrow('Prioridade inválida');
  });

  it('validates and normalizes only the fields supplied for update', () => {
    expect(TaskEntity.validateUpdate({ title: '  Novo título  ' })).toEqual({
      title: 'Novo título'
    });
    expect(TaskEntity.validateUpdate({ status: 'IN_PROGRESS' })).toEqual({
      status: 'IN_PROGRESS'
    });
  });

  it('rejects an empty update and unsupported fields', () => {
    expect(() => TaskEntity.validateUpdate({})).toThrow('ao menos um campo');
    expect(() => TaskEntity.validateUpdate({ id: 2 } as any)).toThrow('Campo inválido');
  });

  it('rejects invalid update values', () => {
    expect(() => TaskEntity.validateUpdate({ title: 'Ab' })).toThrow('ao menos 3 caracteres');
    expect(() => TaskEntity.validateUpdate({ title: 123 } as any)).toThrow('ao menos 3 caracteres');
    expect(() => TaskEntity.validateUpdate({ description: 'Curta' })).not.toThrow();
    expect(() => TaskEntity.validateUpdate({ description: 'Cur' })).toThrow('ao menos 5 caracteres');
    expect(() => TaskEntity.validateUpdate({ description: null } as any)).toThrow('ao menos 5 caracteres');
    expect(() => TaskEntity.validateUpdate({ status: 'READY' as any })).toThrow('Status inválido');
    expect(() => TaskEntity.validateUpdate({ priority: 'URGENT' as any })).toThrow('Prioridade inválida');
  });
});
