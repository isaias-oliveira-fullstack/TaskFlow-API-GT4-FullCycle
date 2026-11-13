# ADR 0001 — Decisão de arquitetura do TaskFlow API

## Status

Aceita.

## Contexto

O projeto exige uma API simples de gerenciamento de tarefas, com foco em fluxo principal funcional, persistência em MySQL e facilidade de manutenção. O banco deve ser reproduzível em Docker, CI e ambiente local, e o código deve manter separação clara entre domínio, aplicação, infraestrutura e apresentação.

## Decisão

Foi adotada uma arquitetura em camadas simples com o padrão Repository Pattern. O domínio centraliza regras e validações; a camada de aplicação executa os casos de uso; a infraestrutura encapsula acesso ao banco mediante Prisma e repositórios; a apresentação expõe os endpoints REST.

## Justificativa da arquitetura

A arquitetura escolhida preserva simplicidade e clareza para um projeto de nível B. Ela permite separar responsabilidades, facilita testes e reduz o acoplamento entre regras de negócio e tecnologia de persistência.

## Justificativa do Repository Pattern

O Repository Pattern isola a infraestrutura de dados e mantém o domínio independente do Prisma. Isso simplifica a validação das regras de negócio e facilita futuras trocas de banco ou migrações sem alterar o restante da aplicação.

## Justificativa da escolha do MySQL

O MySQL 8 é exigido pela atividade e oferece compatibilidade nativa com Prisma, suporte a transações e boa aderência ao cenário de API REST com persistência relacional. Também é uma opção adequada para Docker Compose e para CI em GitHub Actions.

## Alternativas consideradas

- SQLite em desenvolvimento: seria simples, mas não atende à exigência de MySQL e não representa o ambiente final do projeto.
- Arquitetura com módulos independentes e microsserviços: excede o escopo do projeto e aumenta complexidade desnecessária.
- Acesso direto ao Prisma nas rotas: reduz o isolamento da infraestrutura e quebra o padrão solicitado.

## Consequências positivas

- Código mais organizado e fácil de evoluir.
- Testes mais previsíveis e isolados.
- Persistência externa com camada de acesso bem definida.
- Estrutura adequada para Docker e CI.

## Consequências negativas

- Exige mais criação de abstrações simples entre camadas.
- A configuração de ambiente com banco externo exige atenção às variáveis e migrations.
- A implementação de testes de integração exige banco real configurado.
