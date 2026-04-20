# Instrucoes Operacionais do Repositorio

Este documento define o padrao de execucao para alteracoes no projeto.

## 1) Validacao obrigatoria apos alteracoes

- Sempre executar `npm run build` apos qualquer alteracao em codigo TypeScript/JavaScript, scripts ou workflows.
- So commitar e enviar alteracoes quando o build concluir sem erros.

## 2) Politica de Git

- Nao utilizar rebase nos fluxos automatizados.
- Em automacoes (GitHub Actions), usar sincronizacao com `git pull --no-rebase origin main` quando necessario antes de novo push.

## 3) Workflows de dados (separacao obrigatoria)

- Coleta e exportacao devem permanecer em workflows separados:
  - `collect-data.yml`: somente coleta/validacao.
  - `export-data.yml`: sincronizacao geocache, exportacao JSON e publicacao dos dados.
- A exportacao deve ser acionada apos coleta bem-sucedida (via `workflow_run`) ou manualmente (`workflow_dispatch`).

## 4) Publicacao robusta em workflows

- Workflows que fazem commit/push de `public/dados` devem:
  - usar `fetch-depth: 0` no checkout;
  - configurar usuario git do bot;
  - aplicar retry de push (3 tentativas);
  - em rejeicao de push, executar `git pull --no-rebase origin main` antes de tentar novamente.

## 5) Conflito entre workflows

- Workflows que publicam dados devem compartilhar o mesmo grupo de `concurrency` (`dados-publicacao`) com `cancel-in-progress: false`.
- Objetivo: evitar corridas e erro de push `fetch first`.

## 6) Mensagens de commit recomendadas

- Usar prefixos semanticos: `ci:`, `fix:`, `chore:`, `feat:`.
- Para atualizacao automatica de dados, manter o padrao com timestamp UTC.

## 7) Checklist rapido antes de finalizar

1. Build executado com sucesso (`npm run build`).
2. Nenhum erro de lint/build pendente.
3. Workflow alterado segue politica sem rebase.
4. Push testado/validado sem conflito de sincronizacao.
