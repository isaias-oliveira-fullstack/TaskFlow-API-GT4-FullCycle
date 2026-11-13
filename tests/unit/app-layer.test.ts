import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/presentation/app.js';
import { TaskUseCases } from '../../src/application/task-usecases.js';

vi.mock('../../src/infrastructure/database/prisma.js', () => ({
  prisma: {}
}));

const mockTaskUseCases = {
  list: async () => [{
    id: 1,
    title: 'Task de teste',
    description: 'Descrição da tarefa',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }],
  create: async (payload: { title: string; description: string }) => ({
    id: 2,
    title: payload.title,
    description: payload.description,
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }),
  getById: async (id: number) => (id === 1 ? {
    id: 1,
    title: 'Task de teste',
    description: 'Descrição da tarefa',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  } : null),
  updateById: async (id: number, payload: { title?: string }) => (id === 1 ? {
    id: 1,
    title: payload.title ?? 'Task de teste',
    description: 'Descrição da tarefa',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z')
  } : null),
  deleteById: async (id: number) => id === 1
} as any;

const app = createApp(mockTaskUseCases);

describe('App layer', () => {
  it('returns the health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns the metrics endpoint', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toMatch(
      /http_requests_total\{method="GET",route="\/health",status="200"\} [1-9]\d*/
    );
  });

  it('serves Swagger UI with the documented task operations', async () => {
    const pageResponse = await request(app).get('/docs/');
    expect(pageResponse.status).toBe(200);
    expect(pageResponse.text).toContain('swagger-ui');

    const specResponse = await request(app).get('/docs/swagger-ui-init.js');
    expect(specResponse.status).toBe(200);
    expect(specResponse.text).toContain('patch');
    expect(specResponse.text).toContain('delete');
  });

  it('lists tasks', async () => {
    const response = await request(app).get('/tasks');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ title: 'Task de teste' });
  });

  it('returns a task by id', async () => {
    const response = await request(app).get('/tasks/1');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 1, title: 'Task de teste' });
  });

  it('partially updates a task', async () => {
    const response = await request(app)
      .patch('/tasks/1')
      .send({ title: 'Título atualizado' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      title: 'Título atualizado',
      description: 'Descrição da tarefa',
      status: 'PENDING',
      priority: 'HIGH',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    });
  });

  it('returns a not found error when updating a missing task', async () => {
    const response = await request(app)
      .patch('/tasks/999')
      .send({ status: 'COMPLETED' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Tarefa não encontrada.');
  });

  it('rejects empty and invalid update requests', async () => {
    const validationApp = createApp(new TaskUseCases({
      create: async () => ({} as any),
      list: async () => [],
      getById: async () => null,
      updateById: async () => null,
      deleteById: async () => false
    } as any));

    const emptyResponse = await request(validationApp).patch('/tasks/1').send({});
    expect(emptyResponse.status).toBe(400);

    const invalidStatusResponse = await request(validationApp)
      .patch('/tasks/1')
      .send({ status: 'READY' });
    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.message).toContain('Status inválido');
  });

  it('deletes a task and returns no content', async () => {
    const response = await request(app).delete('/tasks/1');
    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('returns a not found error when deleting a missing task', async () => {
    const response = await request(app).delete('/tasks/999');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Tarefa não encontrada.');
  });

  it('returns 400 when deleting with an invalid task id', async () => {
    const response = await request(app).delete('/tasks/not-a-number');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Identificador inválido.');
  });

  it('creates a task', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: 'Nova tarefa', description: 'Descrição válida' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ title: 'Nova tarefa' });
  });

  it('returns a not found error when task is missing', async () => {
    const response = await request(app).get('/tasks/999');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Tarefa não encontrada.');
  });

  it('returns 400 for invalid task ids', async () => {
    const response = await request(app).get('/tasks/not-a-number');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Identificador inválido.');
  });

  it('rejects non-integer and non-positive task ids on all item routes', async () => {
    const getResponse = await request(app).get('/tasks/1.5');
    const patchResponse = await request(app).patch('/tasks/1.5').send({ status: 'PENDING' });
    const deleteResponse = await request(app).delete('/tasks/1.5');
    const zeroResponse = await request(app).get('/tasks/0');

    expect(getResponse.status).toBe(400);
    expect(patchResponse.status).toBe(400);
    expect(deleteResponse.status).toBe(400);
    expect(zeroResponse.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('JSON inválido.');
  });

  it('returns a validation error for invalid input', async () => {
    const invalidApp = createApp({
      list: async () => [],
      create: async () => {
        throw new Error('O título é obrigatório e deve ter ao menos 3 caracteres.');
      },
      getById: async () => null
    } as any);

    const response = await request(invalidApp)
      .post('/tasks')
      .send({ title: 'Ab', description: 'Desc' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('ao menos 3 caracteres');
  });

  it('returns a status validation error', async () => {
    const invalidApp = createApp({
      list: async () => [],
      create: async () => {
        throw new Error('Status inválido: READY.');
      },
      getById: async () => null
    } as any);

    const response = await request(invalidApp)
      .post('/tasks')
      .send({ title: 'Título válido', description: 'Descrição válida', status: 'READY' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Status inválido');
  });

  it('returns an internal server error for unexpected failures', async () => {
    const errorApp = createApp({
      list: async () => [],
      create: async () => {
        throw new Error('Unexpected database failure');
      },
      getById: async () => null
    } as any);

    const response = await request(errorApp)
      .post('/tasks')
      .send({ title: 'Título válido', description: 'Descrição válida' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Erro interno do servidor.');
  });
});
