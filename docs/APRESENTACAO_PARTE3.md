# Roteiro de Apresentação — Parte 3 (24/11/2026)

**Aplicação publicada (Production):** [aconchego-financeiro-zeta.vercel.app](https://aconchego-financeiro-zeta.vercel.app)  
**Repositório (fork):** `https://github.com/RHU4N/aconchego-financeiro`  
**Conta demonstrativa no Supabase Auth:** `<e-mail da conta demonstrativa>` *(credenciais mantidas apenas em local privado / variáveis de ambiente — nunca gravar em repositório)*  
**Comprovante sintético para testar o Scanner ao vivo:** [`docs/samples/comprovante-demo-scanner.png`](samples/comprovante-demo-scanner.png)

---

## 1. Roteiro Cronometrado (5 a 8 minutos)

| Tempo | Bloco | O que mostrar e explicar |
|---|---|---|
| **0:00 – 0:45** | **1. Objetivo do Aconchego** | Controle financeiro pessoal acolhedor (tons bege, verde floresta e terracota), sem planilhas complexas, separando gastos **efetivados (`paid`)** de **pendentes (`pending`)** para evitar falsos saldos. |
| **0:45 – 1:30** | **2. Arquitetura Full Stack** | Frontend **React 19 + TypeScript + Vite + Tailwind v4**; backend **Express / Vercel Functions (`/api/*`)** validando JWT; **Supabase** (Auth, PostgreSQL 17 com RLS nas 10 tabelas, Storage privado com URLs assinadas) e **Google Gemini API (`@google/genai`)** exclusivamente no servidor. |
| **1:30 – 2:10** | **3. Login Real** | Abrir [aconchego-financeiro-zeta.vercel.app](https://aconchego-financeiro-zeta.vercel.app), entrar com a conta demonstrativa configurada via **Supabase Auth verdadeiro**, confirmar ausência do banner de Modo Demonstração e carregamento dos dados persistidos. |
| **2:10 – 3:00** | **4. Dashboard Financeiro** | Em **Novembro de 2026**: mostrar **Entradas Pagas `R$ 5.670,00`**, **Saídas Pagas `R$ 3.117,40`**, **Saldo do Período `R$ 2.552,60`** (mais `R$ 308,40` pendentes a pagar) e **Saldo Geral Efetivado `R$ 4.684,60`** (considerando Out/2026). |
| **3:00 – 3:55** | **5. Extrato e Orçamentos** | No **Extrato**, filtrar por tipo/categoria/pagamento e mostrar lançamento com comprovante privado (`Supermercado Primavera`). Em **Orçamentos**, destacar o alerta amarelo de **Transporte (`89%` — R$ 285,50 / R$ 320,00)** e o alerta vermelho de **Lazer & Cultura (`116%` — R$ 290,00 / R$ 250,00)**. |
| **3:55 – 4:40** | **6. Cofrinhos** | Exibir as 3 metas com histórico de `goal_contributions`: **Reserva de Emergência** (`R$ 5.800,00 / R$ 10.000,00`), **Viagem de Férias** (`R$ 1.700,00 / R$ 3.000,00`) e **Notebook Novo** (`R$ 1.500,00 / R$ 4.500,00`), destacando que depósitos/retiradas não distorcem despesas mensais. |
| **4:40 – 5:35** | **7. Scanner de Comprovantes** | Abrir **Escanear**, enviar [`docs/samples/comprovante-demo-scanner.png`](samples/comprovante-demo-scanner.png) (*Padaria Aconchego LTDA (Demo), R$ 42,90, Pix*). Mostrar prévia editável gerada pelo Gemini e explicar que **nada é salvo até o clique em "Confirmar e Salvar Despesa"**. |
| **5:35 – 6:30** | **8. Agente Gemini (Consultas Reais)** | Abrir **Assistente IA** e enviar perguntas de consulta (ver tabela abaixo). Destacar o rastreio de ferramentas (`toolTraces`) consultando dados reais sob o JWT e RLS do usuário. |
| **6:30 – 7:45** | **9–10. Criação por Linguagem Natural + Confirmação Humana + Persistência** | Enviar: *"Registre uma despesa de R$ 85,50 no supermercado, paga no Pix."* Mostrar o cartão **`pending_confirmation`**, clicar em **"Confirmar e Executar"**, mostrar a RPC atômica `confirm_agent_operation` e **recarregar a página (`F5`)** comprovando persistência real no PostgreSQL. |

---

## 2. Números Exatos Calculados a partir do Seed (`scripts/seed-presentation.ts`)

| Indicador / Módulo | Valor Esperado (Novembro/2026) | Observação |
|---|---|---|
| **Entradas efetivadas (Nov/26)** | **R$ 5.670,00** | Salário R$ 4.500,00 + Freelancer R$ 850,00 + Revisão R$ 320,00 |
| **Saídas efetivadas (Nov/26)** | **R$ 3.117,40** | 12 despesas pagas |
| **Despesas pendentes (Nov/26)** | **R$ 308,40** | Energia elétrica R$ 148,40 (26/11) + Consulta odontológica R$ 160,00 (28/11) |
| **Saldo do período (Nov/26)** | **R$ 2.552,60** | Previsto com pendentes: `R$ 2.244,20` |
| **Saldo geral efetivado (Out + Nov/26)** | **R$ 4.684,60** | Out/26 contribui com `+R$ 2.132,00` (`5.280,00 - 3.148,00`) |
| **Alimentação (Nov/26)** | **R$ 579,50** | R$ 347,80 + R$ 142,20 + R$ 89,50 (Orçamento R$ 900,00 = `64%`) |
| **Transporte (Nov/26)** | **R$ 285,50** | R$ 210,00 + R$ 75,50 (Orçamento R$ 320,00 = `89%`, alerta de proximidade) |
| **Moradia (Nov/26)** | **R$ 1.720,00** | Aluguel R$ 1.400,00 + Condomínio R$ 320,00 (Orçamento R$ 1.900,00 = `91%`) |
| **Lazer & Cultura (Nov/26)** | **R$ 290,00** | Show/jantar R$ 175,00 + Cinema R$ 115,00 (Orçamento R$ 250,00 = `116%`, estouro) |
| **Saúde & Cuidados (Nov/26)** | **R$ 82,60** | Farmácia (mais R$ 160,00 pendente não efetivado; Orçamento R$ 300,00 = `28%`) |
| **Serviços & Contas (Nov/26)** | **R$ 159,80** | Internet R$ 119,90 + Streaming R$ 39,90 (Orçamento R$ 350,00 = `46%`) |
| **Cofrinhos** | **R$ 9.000,00 acumulados** | Emergência R$ 5.800 (`58%`), Férias R$ 1.700 (`57%`, faltam **R$ 1.300,00**), Notebook R$ 1.500 (`33%`) |

---

## 3. Perguntas Recomendadas para Demonstrar o Agente Gemini

| # | Mensagem recomendada no chat | Ferramenta esperada | Resposta / comportamento esperado |
|---|---|---|---|
| **1** | `"Quanto gastei com alimentação em novembro?"` | `listTransactions` / `analyzeSpending` | Informa **R$ 579,50** efetivados (listando Supermercado Primavera R$ 347,80, Hortifruti e padaria R$ 142,20 e Almoço R$ 89,50). |
| **2** | `"Quais são minhas três maiores despesas?"` | `listTransactions` | Lista **Aluguel apartamento (R$ 1.400,00)**, **Supermercado Primavera (R$ 347,80)** e **Condomínio mensal (R$ 320,00)**. |
| **3** | `"Estou perto de ultrapassar meu orçamento de transporte?"` | `listBudgets` | Mostra gasto de **R$ 285,50** sobre limite de **R$ 320,00** (**89% usado**, restando **R$ 34,50** — alerta de proximidade). |
| **4** | `"Registre uma despesa de R$ 85,50 no supermercado, paga no Pix."` | `proposeCreateTransaction` | Gera cartão `pending_confirmation`; só grava no PostgreSQL após clique em **"Confirmar e Executar"** (e bloqueia confirmação duplicada com HTTP `409`). |
| **5** | `"Quanto falta para minha meta de férias?"` | `listFinancialGoals` | Informa acumulado de **R$ 1.700,00** para meta de **R$ 3.000,00**, faltando **R$ 1.300,00** (`57%`). |

---

## 4. Plano de Contingência (Somente se houver indisponibilidade de rede ou cota Gemini na hora)

> **Regra de transparência:** uma demonstração de contingência deve ser **claramente anunciada como contingência** com dados e evidências gravadas previamente — **nunca** apresente uma resposta local/simulada como se fosse uma chamada ao vivo da Gemini API.

1. **Se a rede do auditório cair ou o Wi-Fi estiver instável:**
   - Alternar para roteamento 4G/5G ou rodar localmente (`npm run dev` em `http://localhost:3000` com `.env` conectado ao mesmo Supabase `fhrmqspsxnodlftunsfa`).
2. **Se a Gemini API retornar HTTP `429` (cota temporária) ou `503`:**
   - Explicar o tratamento explícito de erro HTTP `429`/`503`/`504` e o fallback configurado no backend (`gemini-flash-lite-latest`).
   - Mostrar os módulos reais já carregados do Supabase (Dashboard, Extrato, Orçamentos, Cofrinhos e Galeria com comprovante privado funcionando independentemente de IA).
   - Para demonstrar o fluxo completo de IA caso o provedor externo esteja momentaneamente indisponível, **anunciar explicitamente que se trata de evidência de contingência**: exibir as capturas reais em `docs/screenshots/` e o log do smoke test executado previamente contra a Production.
3. **Se o Supabase sofrer latência ou bloqueio de rede local:**
   - Somente em último caso e declarando explicitamente **"Modo Demonstração local (contingência offline)"**, clicar em **"Explorar em Modo Demonstração"** na tela inicial para mostrar a interface interativa sem depender de rede.
4. **Restauração pós-ensaio antes da banca:**
   - Caso faça ensaios criando lançamentos na conta demonstrativa, remova os lançamentos extras pelo próprio Extrato e execute `npm run seed:presentation` para garantir exatamente os 31 lançamentos, 6 orçamentos e 3 cofrinhos iniciais.
