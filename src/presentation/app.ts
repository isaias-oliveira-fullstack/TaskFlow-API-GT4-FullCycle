import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';
import { existsSync, readFileSync } from 'node:fs';
import { prisma } from '../infrastructure/database/prisma.js';
import { PrismaTaskRepository } from '../infrastructure/repositories/task.repository.js';
import { TaskUseCases } from '../application/task-usecases.js';
import logger from '../config/logger.js';
import { httpRequestsTotal, register } from '../config/metrics.js';

const defaultTaskUseCases = new TaskUseCases(new PrismaTaskRepository(prisma));

const parseTaskId = (value: string): number | null => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const createApp = (taskUseCases: TaskUseCases = defaultTaskUseCases) => {
  const app = express();

  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      httpRequestsTotal.inc({
        method: req.method,
        route: req.route?.path ?? 'unmatched',
        status: String(res.statusCode)
      });
      logger.info({
        method: req.method,
        route: req.path,
        statusCode: res.statusCode,
        durationMs
      }, 'HTTP request completed');
    });

    next();
  });

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  const bundledOpenApiPath = new URL('../../docs/openapi.yaml', import.meta.url);
  const openApiPath = existsSync(bundledOpenApiPath)
    ? bundledOpenApiPath
    : new URL('../../../docs/openapi.yaml', import.meta.url);
  const openApiDocument = parse(readFileSync(openApiPath, 'utf8'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.get('/tasks', async (_req, res, next) => {
    try {
      const tasks = await taskUseCases.list();
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post('/tasks', async (req, res, next) => {
    try {
      const task = await taskUseCases.create(req.body ?? {});
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.get('/tasks/:id', async (req, res, next) => {
    try {
      const id = parseTaskId(req.params.id);

      if (id === null) {
        res.status(400).json({ message: 'Identificador inválido.' });
        return;
      }

      const task = await taskUseCases.getById(id);

      if (!task) {
        res.status(404).json({ message: 'Tarefa não encontrada.' });
        return;
      }

      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/tasks/:id', async (req, res, next) => {
    try {
      const id = parseTaskId(req.params.id);

      if (id === null) {
        res.status(400).json({ message: 'Identificador inválido.' });
        return;
      }

      const task = await taskUseCases.updateById(id, req.body ?? {});

      if (!task) {
        res.status(404).json({ message: 'Tarefa não encontrada.' });
        return;
      }

      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/tasks/:id', async (req, res, next) => {
    try {
      const id = parseTaskId(req.params.id);

      if (id === null) {
        res.status(400).json({ message: 'Identificador inválido.' });
        return;
      }

      const deleted = await taskUseCases.deleteById(id);

      if (!deleted) {
        res.status(404).json({ message: 'Tarefa não encontrada.' });
        return;
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err: error }, 'Request error');

    if ('type' in error && error.type === 'entity.parse.failed') {
      res.status(400).json({ message: 'JSON inválido.' });
      return;
    }

    if ('type' in error && error.type === 'entity.too.large') {
      res.status(413).json({ message: 'Corpo da requisição muito grande.' });
      return;
    }

    if (
      error.message.includes('Status inválido') ||
      error.message.includes('Prioridade inválida') ||
      error.message.includes('obrigatória') ||
      error.message.includes('ao menos') ||
      error.message.includes('no máximo') ||
      error.message.includes('Campo inválido') ||
      error.message.includes('corpo da requisição')
    ) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: 'Erro interno do servidor.' });
  });

  return app;
};

export default createApp();
