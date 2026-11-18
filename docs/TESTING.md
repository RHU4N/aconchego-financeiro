# Estratégia e Resultados de Testes — Aconchego Finanças

## 1. Suíte Automatizada

A suíte utiliza **Vitest**, **Testing Library (`@testing-library/react`, `jsdom`)** e **Supertest**, executada com:

```bash
npm test
npm run lint
npm run build
```

## 2. Cobertura por Arquivo de Teste

| Arquivo | Escopo | Principais Garantias Verificadas |
|---|---|---|
| [`src/tests/financeMath.test.ts`](../src/tests/financeMath.test.ts) | Unitário | Precisão em centavos (`0.1 + 0.2 === 0.3`), parsing monetário BR, regra contábil `paid` vs `pending`, cálculo de orçamentos (alerta `>=85%` e estouro), limites e bloqueio de saldo negativo em cofrinhos, mês dinâmico e estados vazios. |
| [`src/tests/schemas.test.ts`](../src/tests/schemas.test.ts) | Unitário | Detecção de MIME real por magic bytes (JPEG/PNG/WebP), rejeição de arquivos falsificados, validação dos schemas do scanner e das 11 ferramentas do agente, e bloqueio de injeção de `userId`. |
| [`src/tests/api.integration.test.ts`](../src/tests/api.integration.test.ts) | Integração API (mocks de Gemini e store em memória por usuário) | Bloqueio 401 sem sessão, rejeição 415 de MIME falsificado, 422 em documento ilegível, 409 em recibo duplicado, 429 em erro de cota, fluxo completo dos 5 exemplos do agente, confirmação humana obrigatória, idempotência (409 em confirmação dupla) e isolamento estrito entre `user-a` e `user-b`. |
| [`src/tests/app.ui.test.tsx`](../src/tests/app.ui.test.tsx) | Interface React (jsdom) | Tela de autenticação (`AuthView`), conta nova autenticada vazia (sem dados de exemplo importados), ativação voluntária do Modo Demonstração, navegação nas 7 abas e revisão editável obrigatória antes de salvar no scanner. |

## 3. Transparência sobre Mocks e Validação Externa

- Os testes automatizados em `api.integration.test.ts` e `app.ui.test.tsx` utilizam mocks controlados para as respostas do Gemini e um store em memória isolado por usuário (`InMemoryServerFinanceStore`) porque o ambiente de execução atual não possui credenciais ativas do Supabase nem chave `GEMINI_API_KEY` configurada.
- A validação real ponta a ponta contra uma instância ativa do Supabase (RLS, Storage privado e confirmação de e-mail) e contra a API Gemini ao vivo deve ser executada após preencher o `.env` no ambiente alvo e no Preview da Vercel.

## 4. Integração Contínua (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) executa automaticamente em cada `push` e `pull_request` na branch `main`:
1. `npm install --no-audit --no-fund`
2. `npm run lint` (`tsc --noEmit`)
3. `npm test` (`vitest run`)
4. `npm run build` (`vite build`)
