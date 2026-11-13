import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99']
  }
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  const healthResponse = http.get(`${baseUrl}/health`);
  check(healthResponse, {
    'API is available': (r) => r.status === 200
  });

  const listResponse = http.get(`${baseUrl}/tasks`);
  check(listResponse, {
    'task list returns 200': (r) => r.status === 200
  });

  const taskPayload = {
    title: 'Tarefa smoke test',
    description: 'Validação rápida do fluxo principal da API',
    status: 'PENDING',
    priority: 'HIGH'
  };

  const createResponse = http.post(`${baseUrl}/tasks`, JSON.stringify(taskPayload), {
    headers: { 'Content-Type': 'application/json' }
  });

  check(createResponse, {
    'task created with 201': (r) => r.status === 201 && Boolean(r.json('id'))
  });

  if (createResponse.status === 201) {
    const taskId = createResponse.json('id');
    const detailResponse = http.get(`${baseUrl}/tasks/${taskId}`);
    check(detailResponse, {
      'created task can be retrieved': (r) => r.status === 200
    });
  }

  sleep(1);
}
