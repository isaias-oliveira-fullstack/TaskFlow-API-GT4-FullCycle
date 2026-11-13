import app from './presentation/app.js';
import env from './config/env.js';
import logger from './config/logger.js';

const server = app.listen(env.port, () => {
  logger.info(`TaskFlow API listening on port ${env.port}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
