import client from 'prom-client';

const { Counter, collectDefaultMetrics, Registry } = client;

const register = new Registry();
collectDefaultMetrics({ register, prefix: 'taskflow_' });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP recebidas pela API',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [register]
});

export { register };
