import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/presentation/app.js';
import { prisma } from '../../src/infrastructure/database/prisma.js';

describe('Task API integration', () => {
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL é obrigatória para executar os testes de integração com MySQL.');
    }

    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Os testes de integração devem executar com NODE_ENV=test.');
    }

    if (new URL(process.env.TEST_DATABASE_URL).pathname !== '/taskflow_test') {
      throw new Error('TEST_DATABASE_URL deve apontar exclusivamente para o banco taskflow_test.');
    }

    await prisma.$connect();
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and reads a task through the API', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Task de integração',
        description: 'Validar criação e recuperação no banco MySQL',
        status: 'PENDING',
        priority: 'HIGH'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Task de integração',
      status: 'PENDING',
      priority: 'HIGH'
    });

    const listResponse = await request(app).get('/tasks');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.some((item: { id: number }) => item.id === response.body.id)).toBe(true);

    const detailResponse = await request(app).get(`/tasks/${response.body.id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.title).toBe('Task de integração');
  });

  it('persists default status and priority when omitted', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa com padrões',
        description: 'Verificar os valores padrão persistidos no MySQL'
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.priority).toBe('MEDIUM');
  });

  it('rejects invalid create data and malformed JSON', async () => {
    const missingTitleResponse = await request(app)
      .post('/tasks')
      .send({ description: 'Descrição válida' });
    expect(missingTitleResponse.status).toBe(400);

    const invalidStatusResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa inválida',
        description: 'Descrição válida',
        status: 'READY'
      });
    expect(invalidStatusResponse.status).toBe(400);

    const invalidPriorityResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa inválida',
        description: 'Descrição válida',
        priority: 'URGENT'
      });
    expect(invalidPriorityResponse.status).toBe(400);

    const malformedJsonResponse = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(malformedJsonResponse.status).toBe(400);
    expect(malformedJsonResponse.body.message).toBe('JSON inválido.');

    const oversizedTitleResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'T'.repeat(256),
        description: 'Descrição válida'
      });
    expect(oversizedTitleResponse.status).toBe(400);
  });

  it('rejects invalid item IDs and reports missing tasks', async () => {
    const invalidGetResponse = await request(app).get('/tasks/1.5');
    const invalidPatchResponse = await request(app)
      .patch('/tasks/1.5')
      .send({ status: 'COMPLETED' });
    const invalidDeleteResponse = await request(app).delete('/tasks/1.5');
    const missingGetResponse = await request(app).get('/tasks/999999');
    const missingDeleteResponse = await request(app).delete('/tasks/999999');

    expect(invalidGetResponse.status).toBe(400);
    expect(invalidPatchResponse.status).toBe(400);
    expect(invalidDeleteResponse.status).toBe(400);
    expect(missingGetResponse.status).toBe(404);
    expect(missingDeleteResponse.status).toBe(404);
  });

  it('updates individual and multiple fields while preserving omitted values and timestamps', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa para atualização',
        description: 'Descrição inicial válida',
        status: 'PENDING',
        priority: 'LOW'
      });

    expect(createResponse.status).toBe(201);
    const original = createResponse.body;

    await new Promise((resolve) => setTimeout(resolve, 25));
    const titleResponse = await request(app)
      .patch(`/tasks/${original.id}`)
      .send({ title: 'Título atualizado' });

    expect(titleResponse.status).toBe(200);
    expect(titleResponse.body).toMatchObject({
      id: original.id,
      title: 'Título atualizado',
      description: original.description,
      status: original.status,
      priority: original.priority,
      createdAt: original.createdAt
    });
    expect(new Date(titleResponse.body.updatedAt).getTime())
      .toBeGreaterThan(new Date(original.updatedAt).getTime());

    const descriptionResponse = await request(app)
      .patch(`/tasks/${original.id}`)
      .send({ description: 'Descrição atualizada para integração' });
    expect(descriptionResponse.status).toBe(200);
    expect(descriptionResponse.body).toMatchObject({
      title: 'Título atualizado',
      description: 'Descrição atualizada para integração',
      status: 'PENDING',
      priority: 'LOW',
      createdAt: original.createdAt
    });

    const statusResponse = await request(app)
      .patch(`/tasks/${original.id}`)
      .send({ status: 'IN_PROGRESS' });
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toMatchObject({
      title: 'Título atualizado',
      description: 'Descrição atualizada para integração',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      createdAt: original.createdAt
    });

    const priorityResponse = await request(app)
      .patch(`/tasks/${original.id}`)
      .send({ priority: 'HIGH' });
    expect(priorityResponse.status).toBe(200);
    expect(priorityResponse.body).toMatchObject({
      title: 'Título atualizado',
      description: 'Descrição atualizada para integração',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: original.createdAt
    });

    const multipleFieldsResponse = await request(app)
      .patch(`/tasks/${original.id}`)
      .send({
        title: 'TaskFlow finalizada',
        description: 'Implementação e testes concluídos',
        status: 'COMPLETED',
        priority: 'MEDIUM'
      });
    expect(multipleFieldsResponse.status).toBe(200);
    expect(multipleFieldsResponse.body).toMatchObject({
      id: original.id,
      title: 'TaskFlow finalizada',
      description: 'Implementação e testes concluídos',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      createdAt: original.createdAt
    });

    const persistedTask = await prisma.task.findUnique({ where: { id: original.id } });
    expect(persistedTask).toMatchObject({
      id: original.id,
      title: 'TaskFlow finalizada',
      description: 'Implementação e testes concluídos',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      createdAt: new Date(original.createdAt)
    });
    expect(persistedTask?.updatedAt.getTime())
      .toBeGreaterThan(new Date(original.updatedAt).getTime());
  });

  it('rejects empty or invalid updates and returns 404 for a missing task', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa protegida',
        description: 'Valores que devem continuar iguais',
        status: 'PENDING',
        priority: 'LOW'
      });
    const taskId = createResponse.body.id;

    const emptyResponse = await request(app).patch(`/tasks/${taskId}`).send({});
    expect(emptyResponse.status).toBe(400);

    const invalidStatusResponse = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ status: 'READY' });
    expect(invalidStatusResponse.status).toBe(400);

    const invalidPriorityResponse = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ priority: 'URGENT' });
    expect(invalidPriorityResponse.status).toBe(400);

    const missingResponse = await request(app)
      .patch('/tasks/999999')
      .send({ status: 'COMPLETED' });
    expect(missingResponse.status).toBe(404);

    const unchangedTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(unchangedTask).toMatchObject({
      title: 'Tarefa protegida',
      description: 'Valores que devem continuar iguais',
      status: 'PENDING',
      priority: 'LOW'
    });
  });

  it('deletes a task through the API and confirms it is absent from MySQL', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Tarefa para exclusão',
        description: 'Confirmar remoção no banco isolado'
      });
    const taskId = createResponse.body.id;

    const deleteResponse = await request(app).delete(`/tasks/${taskId}`);
    expect(deleteResponse.status).toBe(204);

    const persistedTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(persistedTask).toBeNull();
  });
});
