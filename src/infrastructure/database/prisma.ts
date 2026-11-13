import { PrismaClient } from '@prisma/client';
import env from '../../config/env.js';

const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : env.databaseUrl;

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL é obrigatória quando NODE_ENV=test.');
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});
