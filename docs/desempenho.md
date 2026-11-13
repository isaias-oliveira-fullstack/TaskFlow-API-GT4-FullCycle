# Desempenho e Smoke Test

## Objetivo

Validar disponibilidade da API, consulta de tarefas, cadastro de uma tarefa e responder dentro do SLO proposto de 95% das requisições inferiores a 500 ms.

## Ferramenta utilizada

- k6

## Cenário executado

O script `tests/performance/smoke.js` foi preparado para:

- verificar disponibilidade da aplicação;
- consultar tarefas;
- cadastrar uma tarefa;
- validar status HTTP e tempo de resposta.

## Observações de execução

Este ambiente não possui Docker nem k6 instalados, portanto o cenário real não foi executado neste workspace. O arquivo foi mantido pronto para registro de uma execução real em um ambiente com as ferramentas disponíveis.

## Resultado esperado

- Usuários virtuais: 5
- Duração: 30s
- Thresholds: p(95) < 500ms e taxa de falhas < 1%
- Resultado do SLO: pendente até execução real
- Data: pendente até execução real
