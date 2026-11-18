# Guia de Implantação (Supabase + Vercel) — Aconchego Finanças

## 1. Pré-requisitos

- Conta no [Supabase](https://supabase.com) com um projeto PostgreSQL criado.
- Chave válida da API Gemini ([Google AI Studio](https://aistudio.google.com/apikey)).
- Conta na [Vercel](https://vercel.com) conectada ao repositório GitHub.

## 2. Configuração do Supabase

### 2.1 Aplicar Migrations
Execute a migration versionada [`supabase/migrations/20261117000001_initial_schema.sql`](../supabase/migrations/20261117000001_initial_schema.sql):

- **Via Supabase CLI:**
  ```bash
  npx supabase link --project-ref SEU_PROJECT_REF
  npx supabase db push
  ```
- **Via SQL Editor (Painel Supabase):**
  Cole e execute todo o conteúdo de `supabase/migrations/20261117000001_initial_schema.sql`.

Verifique após executar:
1. As 10 tabelas existem no schema `public` com RLS ativado.
2. Os buckets privados `receipts` e `goal-images` aparecem em **Storage → Buckets** com `Public = false`.

### 2.2 URLs de Redirecionamento e SMTP Próprio
1. Em **Authentication → URL Configuration**, adicione:
   - `Site URL`: URL de produção/preview na Vercel (`https://seu-app.vercel.app`)
   - `Redirect URLs`: `http://localhost:3000/**` e `https://seu-app.vercel.app/**`
2. Para uso público contínuo, configure um provedor SMTP dedicado em **Authentication → SMTP Settings** (Resend, Postmark, SendGrid ou SES), pois o SMTP padrão do Supabase limita drasticamente envios por hora. **Não** desative a confirmação de e-mail como atalho.

## 3. Variáveis de Ambiente

Configure localmente em `.env` (a partir de [`.env.example`](../.env.example)) e no painel **Settings → Environment Variables** da Vercel:

| Variável | Visibilidade | Obrigatória | Descrição |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Pública (build Vite + API) | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Pública (build Vite + API) | Sim | Publishable / Anon Key do Supabase |
| `GEMINI_API_KEY` | **Privada (Servidor)** | Sim | Chave da Gemini API (nunca prefixar com `VITE_`) |
| `GEMINI_MODEL` | **Privada (Servidor)** | Recomendada | Modelo Gemini (ex: `gemini-2.5-flash`) |
| `APP_URL` | Servidor | Recomendada | URL pública da aplicação |

## 4. Publicação na Vercel

O arquivo [`vercel.json`](../vercel.json) e a função serverless [`api/[...route].ts`](../api/[...route].ts) já configuram:
- Build estático do Vite para `dist/` (`npm run build`).
- Roteamento de `/api/*` para a Vercel Function Express (`api/[...route].ts`).
- Fallback SPA para `index.html` em todas as rotas de navegador.

Passos no painel da Vercel:
1. Importe o repositório `medeirosfbia/aconchego-financeiro`.
2. Mantenha **Framework Preset: Vite**, **Build Command: `npm run build`** e **Output Directory: `dist`**.
3. Cadastre as 5 variáveis de ambiente para **Production** e **Preview**.
4. Gere primeiro um **Preview Deployment** e valide os 10 critérios de sucesso antes de promover para produção.
