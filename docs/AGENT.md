# Agente Financeiro IA e Scanner — Aconchego Finanças

## 1. Arquitetura do Agente (`src/server/agentService.ts`)

O Assistente Financeiro utiliza o SDK oficial `@google/genai` (`^3.4.0`) no backend, com **function calling real** controlado por schemas `zod` (`.strict()`) e modelo configurável via `GEMINI_MODEL` (padrão: `gemini-2.5-flash`).

### Fluxo de Execução

```mermaid
sequenceDiagram
  actor User as Usuário Autenticado
  participant UI as AgentAssistantView.tsx
  participant API as POST /api/agent/chat
  participant Gemini as Gemini API
  participant Math as financeMath.ts
  participant DB as Supabase (RLS)

  User->>UI: "Registre uma compra de R$ 85,50 no supermercado, paga no Pix."
  UI->>API: Envia mensagem + Bearer JWT
  API->>Gemini: Prompt + 11 FunctionDeclarations
  Gemini-->>API: FunctionCall proposeCreateTransaction(...)
  API->>API: Valida schema Zod + bloqueia userId externo
  API->>DB: Insere em agent_operations (pending_confirmation)
  API-->>Gemini: FunctionResponse { proposalId, status: pending_confirmation }
  Gemini-->>API: Resposta em PT-BR pedindo confirmação
  API-->>UI: Exibe cartão com argumentos exatos
  User->>UI: Clica em "Confirmar e Executar"
  UI->>API: POST /api/agent/confirm { operationId, action: "confirm" }
  API->>DB: Claim atômico + INSERT em transactions (idempotente)
```

## 2. Catálogo das 11 Ferramentas

| Ferramenta | Tipo | O que faz |
|---|---|---|
| `getFinancialSummary` | Leitura | Calcula entradas pagas/pendentes, saídas pagas/pendentes, saldo do período e saldo geral efetivado. |
| `listTransactions` | Leitura | Filtra lançamentos reais do usuário por período, tipo, categoria, status, pagamento ou busca. |
| `listBudgets` | Leitura | Calcula gasto efetivado, pendente, restante, percentual e alertas de proximidade/estouro. |
| `listFinancialGoals` | Leitura | Lista cofrinhos do usuário e calcula progresso (%) e valor restante. |
| `analyzeSpending` | Análise | Ranqueia categorias com maiores despesas efetivadas no período com aviso educacional. |
| `suggestBudgetPlan` | Sugestão | Gera alocação educacional de referência baseada na renda registrada ou informada. |
| `proposeCreateTransaction` | Proposta | Cria registro `pending_confirmation` para nova receita ou despesa. |
| `proposeUpdateTransaction` | Proposta | Valida existência da transação do usuário e propõe alterações para confirmação. |
| `proposeDeleteTransaction` | Proposta | Valida existência da transação do usuário e propõe exclusão com confirmação obrigatória. |
| `proposeUpdateBudget` | Proposta | Propõe criação/ajuste de limite mensal em categoria de despesa. |
| `proposeGoalContribution` | Proposta | Valida existência do cofrinho e saldo para resgate; propõe depósito ou retirada. |

## 3. Salvaguardas Obrigatórias

- **Isolamento de proprietário:** O `userId` é extraído exclusivamente do JWT validado em `authMiddleware.ts`. Qualquer tentativa de enviar `userId`, `user_id` ou `ownerId` nos argumentos de ferramenta é bloqueada por `assertNoOwnerOverride` e por `.strict()` nos schemas Zod.
- **Cálculos determinísticos:** Somas, subtrações, percentuais e saldos são sempre calculados em `src/utils/financeMath.ts` usando centavos inteiros.
- **Confirmação humana obrigatória:** Nenhuma ferramenta `propose*` altera `transactions`, `budgets`, `financial_goals` ou `goal_contributions`. A alteração só ocorre via `/api/agent/confirm` após clique explícito do usuário.
- **Idempotência:** Cada operação recebe um `idempotency_key` único. A reivindicação otimista em `agent_operations` (`.eq('status', 'pending_confirmation')`) garante que uma segunda requisição retorne HTTP `409 Conflict` sem duplicar lançamentos.
- **Limites de execução:** Máximo de 3 rodadas de function calling e 6 chamadas de ferramenta por turno, timeout de 30s e rate limiting (`SlidingWindowRateLimiter`).
- **Conformidade:** O agente não recomenda investimentos ou produtos financeiros específicos e anexa aviso educacional (`EDUCATIONAL_DISCLAIMER`) em análises e planos de orçamento.

## 4. Scanner Inteligente de Comprovantes (`src/server/receiptScanner.ts`)

1. Aceita imagens **JPG, PNG e WebP** até **8 MB**.
2. Valida os **magic bytes reais** do buffer decodificado (`detectImageMimeFromMagicBytes`), rejeitando arquivos falsificados ou incompatíveis (HTTP 415/400).
3. Calcula o hash **SHA-256** do arquivo e bloqueia importações repetidas (HTTP 409 + constraint `UNIQUE (user_id, file_hash)` no banco).
4. Envia a imagem ao Gemini configurado via `GEMINI_MODEL` com schema estruturado e timeout de 25s.
5. Rejeita documentos ilegíveis ou não financeiros (HTTP 422) e lista eventuais campos incertos em `uncertainFields`.
6. O frontend (`ScanReceiptView.tsx`) exibe uma **prévia editável** com destaque para os campos incertos e **exige confirmação humana** antes de enviar a imagem ao bucket privado e gravar a transação.
