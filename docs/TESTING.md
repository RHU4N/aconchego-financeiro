# Estratégia e Resultados de Testes — Aconchego Finanças

## 1. Suíte Automatizada e E2E

A suíte utiliza **Vitest**, **Testing Library (`@testing-library/react`, `jsdom`)**, **Supertest** e **Playwright (`@playwright/test`)**, executada com:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Para executar o Playwright contra o Preview da Vercel protegido por Deployment Protection SSO, defina:
```bash
PLAYWRIGHT_BASE_URL=https://aconchego-financeiro-9vls9qn3r-rhu4ns-projects.vercel.app
VERCEL_BYPASS_TOKEN=seu_token_de_automacao_vercel
npm run test:e2e
```

## 2. Cobertura por Arquivo de Teste

| Arquivo | Escopo | Quantidade | Principais Garantias Verificadas |
|---|---|---|---|
| [`src/tests/financeMath.test.ts`](../src/tests/financeMath.test.ts) | Unitário | 9 testes | Precisão em centavos (`0.1 + 0.2 === 0.3`), parsing monetário BR, regra contábil `paid` vs `pending`, cálculo de orçamentos (alerta `>=85%` e estouro), limites e bloqueio de saldo negativo em cofrinhos, mês dinâmico e estados vazios. |
| [`src/tests/schemas.test.ts`](../src/tests/schemas.test.ts) | Unitário | 5 testes | Detecção de MIME real por magic bytes (JPEG/PNG/WebP), rejeição de arquivos falsificados, validação dos schemas do scanner e das 11 ferramentas do agente, e bloqueio de injeção de `userId`. |
| [`src/tests/api.integration.test.ts`](../src/tests/api.integration.test.ts) | Integração API (mocks de Gemini e store em memória) | 9 testes | Bloqueio 401 sem sessão, rejeição 415 de MIME falsificado, 422 em documento ilegível, 409 em recibo duplicado, 429 em erro de cota, fluxo completo dos 5 exemplos do agente, confirmação humana obrigatória, idempotência (409 em confirmação dupla), isolamento entre `user-a` e `user-b` e bloqueio de prompt injection tentando passar `userId` alheio. |
| [`src/tests/app.ui.test.tsx`](../src/tests/app.ui.test.tsx) | Interface React (jsdom) | 5 testes | Tela de autenticação (`AuthView`), conta nova autenticada vazia (sem dados de exemplo importados), ativação voluntária do Modo Demonstração, navegação nas 7 abas e revisão editável obrigatória antes de salvar no scanner. |
| [`e2e/aconchego.spec.ts`](../e2e/aconchego.spec.ts) | E2E Real em Navegador (Playwright Chromium) | 5 testes (4 locais + 1 condicional) | (1) `/api/health`, 401 em `/api/agent/chat` e `/api/receipts/scan` e `AuthView`; (2) criação, reload e edição de transação no Modo Demonstração; (3) orçamentos e cofrinhos (depósito, bloqueio de saque acima do saldo e resgate); (4) mobile `375x812` sem overflow horizontal; (5) integração real Supabase + Gemini (ignorada/skipped quando faltam credenciais reais). |

**Totais verificados no servidor local (`http://127.0.0.1:3100`):**
- Vitest (`npm test`): **4 arquivos, 28/28 testes aprovados**.
- Playwright (`npm run test:e2e`): **4 aprovados, 1 ignorado (skipped)** por ausência de `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `GEMINI_API_KEY` reais.

## 3. Transparência sobre Mocks e Validação Externa

- Os testes automatizados em `api.integration.test.ts` e `app.ui.test.tsx` utilizam mocks controlados para as respostas do Gemini e um store em memória isolado por usuário (`InMemoryServerFinanceStore`) porque o ambiente atual não possui credenciais ativas do Supabase dedicadas ao Aconchego nem `GEMINI_API_KEY` configurada.
- **NÃO VALIDADO**: os testes ponta a ponta ao vivo contra uma instância ativa do Supabase (Auth real, RLS com duas contas reais, Storage privado) e contra a API Gemini ao vivo permanecem pendentes de credenciais reais e autorização para aplicar as migrations remotamente.
- Os testes Playwright contra o Preview URL na Vercel sem `VERCEL_BYPASS_TOKEN` foram bloqueados pela tela de SSO do Vercel Deployment Protection; em paralelo, o endpoint e as rotas no Preview foram validados diretamente via `vercel curl` (`GET /api/health` → 200, `HEAD /` → 200, `GET /extrato` → 200, `POST /api/agent/chat` → 401, `POST /api/receipts/scan` → 401).

## 4. Integração Contínua (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) executa automaticamente em cada `push` e `pull_request` na branch `main`:
1. `npm install --no-audit --no-fund`
2. `npm run lint` (`tsc --noEmit`)
3. `npm test` (`vitest run`)
4. `npm run build` (`vite build`)
