# TaskFlow API

[![CI](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle/actions/workflows/ci.yml/badge.svg)](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle/actions/workflows/ci.yml) ![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white) ![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?logo=prisma&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-Testes-6E9F18?logo=vitest&logoColor=white)

API REST para cadastro e gerenciamento de tarefas, com persistência em MySQL. Este projeto foi desenvolvido como trabalho final da **Formação FullCycle — Engenharia de Software** e demonstra organização em camadas, Repository Pattern, validação de domínio, testes automatizados e execução com Docker Compose.

## Sobre o projeto

O TaskFlow permite criar, consultar, atualizar e excluir tarefas por meio de uma API REST. A proposta é aplicar conceitos de engenharia de software em um projeto prático, incluindo separação de responsabilidades, persistência de dados, documentação de API, observabilidade e testes.

**Nível:** Projeto final da Formação FullCycle - Engenharia de Software, com foco em desenvolvimento backend e arquitetura em camadas.

## Materiais para entrega

- **Repositório:** [TaskFlow API no GitHub](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle)
- **CI:** [Execuções do GitHub Actions](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle/actions/workflows/ci.yml). Após o próximo push, confira se a execução mais recente terminou com sucesso.
- **Desempenho:** [docs/desempenho.md](./docs/desempenho.md)
- **Contribuição individual:** [CONTRIBUTORS.md](./CONTRIBUTORS.md)

## Preview

### Demonstração da Aplicação

Confira abaixo uma demonstração do uso da API para criar, consultar e excluir tarefas.

**Vídeo demonstrativo no arquivo a seguir:** [preview.mp4](./preview.mp4)

Clique na miniatura abaixo para assistir à demonstração completa no YouTube:

[![Assistir à demonstração do TaskFlow API](https://img.youtube.com/vi/SFBjGeGHfbo/maxresdefault.jpg)](https://www.youtube.com/watch?v=SFBjGeGHfbo)

## Funcionalidades

- Criar, listar, consultar, atualizar parcialmente e excluir tarefas.
- Validar título, descrição, status e prioridade.
- Expor health check, métricas Prometheus e documentação interativa Swagger.
- Persistir dados em MySQL por meio do Prisma ORM.

Os status disponíveis são `PENDING`, `IN_PROGRESS` e `COMPLETED`. As prioridades são `LOW`, `MEDIUM` e `HIGH`.

## Tecnologias

- Node.js 22 e TypeScript
- Express
- Prisma ORM e MySQL 8
- Docker Desktop e Docker Compose
- Vitest e Supertest
- ESLint
- Pino e prom-client
- Swagger UI e OpenAPI 3
- k6 para o teste de carga opcional

## Arquitetura

O código separa responsabilidades nas seguintes camadas:

- **Domain:** entidade, tipos e validações das tarefas.
- **Application:** casos de uso da aplicação.
- **Infrastructure:** Prisma Client e implementação do repositório MySQL.
- **Presentation:** rotas HTTP, códigos de resposta e documentação Swagger.

O Repository Pattern mantém o acesso ao banco atrás da interface `TaskRepository`.

## Estrutura do projeto

```text
src/
  application/       casos de uso
  config/            ambiente, logs e métricas
  domain/            entidade, tipos e validações
  infrastructure/
    database/        Prisma Client
    repositories/    repositório Prisma
  presentation/      rotas e aplicação Express
prisma/
  migrations/        migrations versionadas
  schema.prisma      schema Prisma
tests/
  integration/       testes HTTP com MySQL
  performance/       teste de carga k6
  unit/              testes de domínio, casos de uso, repositório e rotas
docs/
  adr/               decisão de arquitetura
  openapi.yaml        contrato OpenAPI
docker/mysql/        inicialização do banco de testes
```

## Pré-requisitos

Para executar com Docker:

- Docker Desktop com integração WSL 2 habilitada.
- Ubuntu WSL 2 e Docker Compose v2.
- `curl` para os exemplos de requisição.

Para executar Node.js fora dos contêineres, instale também Node.js 22 e npm no Ubuntu WSL.

## Configuração do ambiente

No Ubuntu WSL, na pasta do projeto:

```bash
cd /mnt/c/TaskFlow-API-GT4-FullCycle
cp .env.example .env
```

Configure o arquivo `.env` localmente. Não o publique nem use os valores demonstrativos do `.env.example` em ambientes compartilhados ou de produção.

| Variável | Uso |
|---|---|
| `PORT` | Porta HTTP da API; o exemplo usa `3000`. |
| `NODE_ENV` | Ambiente da aplicação; o Compose configura `production` para a API. |
| `DATABASE_URL` | Conexão Prisma com o banco principal. No Compose, a API recebe uma URL usando o host interno `db`. |
| `TEST_DATABASE_URL` | Conexão isolada com `taskflow_test`. É obrigatória para executar a aplicação em `NODE_ENV=test`. |
| `MYSQL_DATABASE` | Nome do banco principal criado pelo contêiner MySQL. |
| `MYSQL_USER` | Usuário MySQL da aplicação. |
| `MYSQL_PASSWORD` | Senha local do usuário MySQL da aplicação. |
| `MYSQL_ROOT_PASSWORD` | Senha local da conta administrativa do MySQL. |
| `LOG_LEVEL` | Opcional; ajusta o nível do logger Pino. |

O `.env` é ignorado pelo Git e pelo contexto de build do Docker. Use credenciais próprias e fortes fora de um ambiente local descartável.

## Execução com Docker Compose

O caminho recomendado para iniciar a aplicação completa:

```bash
cd /mnt/c/TaskFlow-API-GT4-FullCycle
docker compose config --quiet
docker compose up --build -d
docker compose ps
curl -i http://localhost:3000/health
```

O Compose inicia os serviços `db` e `api`. O MySQL publica a porta `3306`, usa o volume persistente `mysql_data` e possui health check. A API aguarda o banco ficar saudável, aplica as migrations existentes e escuta na porta `3000`. Dentro da rede Docker, a API acessa o banco pelo host `db`, não por `localhost`.

Para verificar o estado e os logs:

```bash
docker compose ps
docker compose logs --tail=100 api db
```

O Compose configura health check para o MySQL; a API expõe `GET /health`, mas não possui health check próprio no `docker-compose.yml`. `docker compose down` remove os contêineres, mas preserva `mysql_data`. Não use `docker compose down -v` se precisar manter os dados.

## Execução local fora do Docker

É possível executar o processo Node.js no WSL enquanto o MySQL continua no Docker. Inicie somente o banco para evitar conflito com a API de porta `3000`:

```bash
cd /mnt/c/TaskFlow-API-GT4-FullCycle
docker compose up -d db
```

Para o processo Node local, `DATABASE_URL` e `TEST_DATABASE_URL` devem usar `127.0.0.1:3306` e apontar, respectivamente, para `taskflow` e `taskflow_test`; o `.env.example` já usa esse endereço. O serviço `api` no Compose recebe URLs próprias com o host interno `db`, que não resolve fora da rede Docker. Codifique caracteres especiais da senha conforme a sintaxe de URL.

Instale dependências, gere o cliente Prisma, aplique as migrations no banco principal e inicie a API:

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

O comando `npm run dev` inicia o servidor com recarga de desenvolvimento. Para iniciar o build compilado, execute `npm run build` e depois `npm start`.

## MySQL e Prisma

- Banco principal: `taskflow`.
- Banco exclusivo para testes: `taskflow_test`.
- Modelo atual: `Task`, sem relacionamentos.
- Migration versionada: `prisma/migrations/202411110001_init`.
- A migration é aplicada automaticamente ao iniciar o serviço `api` no Docker; fora do Docker, use `npm run prisma:deploy`.

O modelo guarda `id`, `title`, `description`, `status`, `priority`, `createdAt` e `updatedAt`. O Prisma mantém `updatedAt` ao atualizar uma tarefa. Não há necessidade de migration para os endpoints atuais.

O script `docker/mysql/init-test-database.sql` cria o banco de testes e concede acesso durante a inicialização de um volume MySQL novo. Scripts de inicialização não são reaplicados em um volume já existente; confirme a configuração do banco de teste antes de executar a suíte de integração.

## Endpoints

| Método e rota | Resultado | Respostas principais |
|---|---|---|
| `GET /health` | Estado HTTP da API | `200` |
| `GET /metrics` | Métricas em formato Prometheus | `200` |
| `GET /docs/` | Interface Swagger UI | `200` |
| `POST /tasks` | Cria uma tarefa | `201`, `400`, `500` |
| `GET /tasks` | Lista tarefas | `200`, `500` |
| `GET /tasks/:id` | Consulta por ID | `200`, `400`, `404`, `500` |
| `PATCH /tasks/:id` | Atualiza somente os campos enviados | `200`, `400`, `404`, `500` |
| `DELETE /tasks/:id` | Exclui a tarefa | `204`, `400`, `404`, `500` |

O Express também aceita `GET /tasks/`. Os IDs de tarefa devem ser inteiros positivos. Títulos devem ter entre 3 e 255 caracteres e descrições ao menos 5; espaços no início e no fim são removidos. Status e prioridade devem usar os valores listados na seção de funcionalidades.

### Criar uma tarefa

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar TypeScript",
    "description": "Praticar tipos e funções assíncronas",
    "status": "PENDING",
    "priority": "MEDIUM"
  }'
```

Uma resposta `201` contém a tarefa criada, incluindo ID e timestamps:

```json
{
  "id": 123,
  "title": "Estudar TypeScript",
  "description": "Praticar tipos e funções assíncronas",
  "status": "PENDING",
  "priority": "MEDIUM",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

`title` e `description` são obrigatórios. Se `status` ou `priority` forem omitidos, são usados `PENDING` e `MEDIUM`.

### Listar e consultar tarefas

```bash
curl -i http://localhost:3000/tasks
curl -i http://localhost:3000/tasks/123
```

### Atualizar parcialmente uma tarefa

Envie somente os campos que deseja alterar:

```bash
curl -i -X PATCH http://localhost:3000/tasks/123 \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

Também é possível enviar mais de um campo:

```bash
curl -i -X PATCH http://localhost:3000/tasks/123 \
  -H "Content-Type: application/json" \
  -d '{"title":"Finalizar TaskFlow API","priority":"HIGH"}'
```

O corpo não pode estar vazio nem conter campos desconhecidos. `id` e `createdAt` não são alterados; a resposta `200` contém a tarefa atualizada.

### Excluir uma tarefa

```bash
curl -i -X DELETE http://localhost:3000/tasks/123
```

Uma exclusão concluída retorna `204` sem corpo. Se a tarefa não existir, a API retorna `404`.

### Health, métricas e Swagger

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/metrics
```

`/health` informa se o processo HTTP está ativo; não executa uma consulta de verificação ao MySQL. A documentação interativa está em [http://localhost:3000/docs/](http://localhost:3000/docs/), e o contrato está em `docs/openapi.yaml`.

## Tratamento de erros

Erros de validação, JSON malformado e IDs inválidos retornam `400`. Um corpo acima do limite do parser JSON retorna `413`. IDs válidos que não correspondem a uma tarefa retornam `404`. Falhas inesperadas retornam `500` com uma mensagem genérica; detalhes são registrados pelo logger, não enviados ao cliente.

As respostas de erro da API seguem o formato:

```json
{
  "message": "Tarefa não encontrada."
}
```

## Testes automatizados

Os testes de integração conectam ao MySQL real definido por `TEST_DATABASE_URL` e verificam que ele aponta especificamente para `taskflow_test`. A preparação da suíte apaga as tarefas **desse banco de testes**, não as do banco principal. Nunca execute testes de integração com `TEST_DATABASE_URL` apontando para dados que deseja preservar.

Com os serviços Docker ativos, execute:

```bash
docker compose exec api npm run typecheck
docker compose exec api npm run lint
docker compose exec api npm run test:unit
docker compose exec -e NODE_ENV=test api npm run test:integration
docker compose exec -e NODE_ENV=test api npm test
docker compose exec api npm run build
```

`npm test` executa a suíte completa com cobertura. O Vitest exige cobertura mínima de 80% para statements, branches, functions e lines. Os testes unitários cobrem domínio, casos de uso, repositório e camada HTTP; a suíte de integração cobre a API com MySQL.

## Scripts do package.json

| Script | Finalidade |
|---|---|
| `npm run dev` | Executa o servidor em modo de desenvolvimento. |
| `npm run build` | Compila TypeScript para `dist/`. |
| `npm run typecheck` | Verifica tipos sem gerar build. |
| `npm start` | Inicia o servidor compilado. |
| `npm run lint` | Executa ESLint. |
| `npm test` | Executa todos os testes com cobertura. |
| `npm run test:unit` | Executa testes unitários. |
| `npm run test:integration` | Executa testes de integração com MySQL de testes. |
| `npm run prisma:generate` | Gera o Prisma Client. |
| `npm run prisma:migrate` | Executa `prisma migrate dev`; use durante desenvolvimento de schema. |
| `npm run prisma:deploy` | Aplica migrations existentes. |
| `npm run prisma:studio` | Abre Prisma Studio para o banco selecionado pelo ambiente. |
| `npm run smoke` | Executa `tests/performance/smoke.js` com k6 instalado. |

O smoke test cria tarefas repetidamente e não as exclui. Execute-o somente contra um banco descartável ou ambiente de teste; ele pode deixar registros no banco usado pela API.

## Considerações de segurança e operação

O projeto é uma API de demonstração e não implementa autenticação, autorização nem limitação de requisições. Não a exponha publicamente sem controles adicionais. Use credenciais próprias no `.env`, mantenha esse arquivo fora do controle de versão e preserve o volume `mysql_data` ao recriar os contêineres.

## Conclusão

O TaskFlow API foi desenvolvido como projeto final da **Formação FullCycle — Engenharia de Software**, no âmbito do programa Geração Tech 4.0. O projeto aplica conceitos de desenvolvimento backend com Node.js, TypeScript, Express, Prisma e MySQL, além de arquitetura em camadas, testes automatizados, documentação OpenAPI e execução com Docker.

## Contribuição

Para relatar problemas ou sugerir melhorias, abra uma **[Issue](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle/issues)**. Para contribuir com alterações, envie um **[Pull Request](https://github.com/isaias-oliveira-fullstack/TaskFlow-API-GT4-FullCycle/pulls)**.

## Licença

Este repositório ainda não contém um arquivo de licença. Defina e adicione uma licença antes de autorizar a reutilização ou distribuição do projeto.

Quando disponível, os termos da licença estarão descritos no arquivo **[LICENSE](./LICENSE)** na raiz do repositório.

## Autor

Projeto desenvolvido por **Isaias Oliveira**.  
Conecte-se comigo no **[in/isaias-oliveira-dev](https://www.linkedin.com/in/isaias-oliveira-dev/)**
