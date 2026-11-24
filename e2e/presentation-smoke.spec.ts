import crypto from 'node:crypto';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { test, expect } from '@playwright/test';

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'PRES_USER_EMAIL',
  'PRES_USER_PASSWORD',
];
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

// Nunca registrar senhas, tokens ou JWTs em traces/capturas.
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.describe('Smoke Test da Apresentação (Parte 3 — 24/11/2026)', () => {
  test('login real, dados do seed, CRUD persistente, Gemini real, confirmação e isolamento RLS', async ({
    page,
    request,
  }) => {
    test.skip(
      required.some((k) => !process.env[k]?.trim()),
      'NÃO VALIDADO: requer VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, PRES_USER_EMAIL e PRES_USER_PASSWORD.'
    );

    test.setTimeout(180_000);

    const marker = `SMOKE-${crypto.randomUUID().slice(0, 8)}`;
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const email = process.env.PRES_USER_EMAIL!;
    const password = process.env.PRES_USER_PASSWORD!;

    const makeClient = (): SupabaseClient =>
      createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const presClient = makeClient();
    const { data: authData, error: authErr } = await presClient.auth.signInWithPassword({
      email,
      password,
    });
    expect(authErr?.code).toBeUndefined();
    expect(Boolean(authData.session)).toBe(true);
    const session = authData.session!;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    const conversationIds = new Set<string>();
    let smokeGoalId: string | undefined;

    try {
      // 1. Abrir aplicação e fazer login real pela interface
      await page.goto('/');
      await page.locator('#auth-email').fill(email);
      await page.locator('#auth-password').fill(password);
      await page.getByRole('button', { name: 'Entrar no Aconchego', exact: true }).click();

      await expect(page.getByRole('button', { name: 'Nova Transação' }).first()).toBeVisible({
        timeout: 25_000,
      });
      await expect(page.getByText(/Modo Demonstração ativo/i)).toHaveCount(0);

      // 2. Confirmar Dashboard populado com o mês de novembro/2026
      await expect(page.getByText('R$ 5.670,00').first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Reserva de Emergência').first()).toBeVisible();
      await expect(page.getByText('Viagem de Férias').first()).toBeVisible();

      // 3. Extrato: confirmar dados do seed, criar e editar lançamento temporário + persistência
      const nav = page.getByRole('navigation', { name: 'Navegação Principal', exact: true });
      await nav.getByRole('button', { name: 'Extrato', exact: true }).click();
      await expect(page.getByText('Supermercado Primavera').first()).toBeVisible();

      await page.getByRole('button', { name: 'Nova Transação' }).first().click();
      await page.locator('#tx-description').fill(marker);
      await page.locator('#tx-amount').fill('49,90');
      await page.locator('#tx-category').selectOption('Educação');
      await page.locator('#tx-account').selectOption('Pix');
      await page.getByRole('button', { name: 'Adicionar Lançamento' }).click();
      await expect(page.getByText(marker, { exact: true })).toBeVisible();

      await page.getByRole('button', { name: `Editar ${marker}`, exact: true }).click();
      await page.locator('#tx-amount').fill('55,00');
      await page.getByRole('button', { name: 'Salvar Alterações' }).click();
      await expect.poll(
        async () =>
          (
            await presClient
              .from('transactions')
              .select('amount')
              .eq('description', marker)
              .single()
          ).data?.amount
      ).toBe(55);

      await page.reload();
      await nav.getByRole('button', { name: 'Extrato', exact: true }).click();
      await expect(page.getByText(marker, { exact: true })).toBeVisible();

      // 4. Orçamentos: validar alertas de 89% (Transporte) e 116% (Lazer & Cultura)
      await nav.getByRole('button', { name: 'Orçamentos', exact: true }).click();
      await expect(page.getByText('Transporte').first()).toBeVisible();
      await expect(page.getByText('Lazer & Cultura').first()).toBeVisible();
      await expect(page.getByText(/116%/).first()).toBeVisible();

      // 5. Cofrinhos: validar os 3 cofrinhos do seed e testar depósito temporário
      await nav.getByRole('button', { name: 'Cofrinhos', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Reserva de Emergência' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Notebook Novo' })).toBeVisible();

      await page.getByRole('button', { name: 'Criar Cofrinho', exact: true }).click();
      await page.locator('#goal-title').fill(marker);
      await page.locator('#goal-target').fill('500,00');
      await page.locator('#goal-current').fill('0,00');
      await page.getByRole('button', { name: 'Salvar Cofrinho' }).click();

      const goalCard = page.locator('div.rounded-2xl', { hasText: marker }).first();
      await goalCard.getByRole('button', { name: 'Guardar', exact: true }).click();
      await page.getByPlaceholder('0,00').fill('125,00');
      await page.getByRole('button', { name: 'Confirmar Depósito' }).click();
      await expect(goalCard.getByText('R$ 125,00', { exact: true })).toBeVisible();

      const goalRow = await presClient
        .from('financial_goals')
        .select('id, current_amount')
        .eq('title', marker)
        .single();
      smokeGoalId = goalRow.data?.id;
      expect(goalRow.data?.current_amount).toBe(125);

      // 6. Galeria: verificar comprovante privado do seed carregado sem erro
      await nav.getByRole('button', { name: /Comprovantes/ }).click();
      const receiptImg = page.locator('img[alt="Supermercado Primavera"]').first();
      await expect(receiptImg).toBeVisible();
      await expect
        .poll(async () => receiptImg.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);

      // 7. Scanner Gemini: prévia editável com documento sintético sem gravar antes da confirmação
      await nav.getByRole('button', { name: 'Escanear', exact: true }).click();
      await page
        .locator('input[type="file"]:not([capture])')
        .setInputFiles(path.resolve('docs/samples/comprovante-demo-scanner.png'));
      await expect(page.locator('#scan-desc')).toBeVisible({ timeout: 45_000 });
      const parsedAmount = await page.locator('#scan-amount').inputValue();
      expect(Number(parsedAmount.replace(',', '.'))).toBeGreaterThan(0);

      // 8. Agente Gemini real: 5 perguntas da apresentação + confirmação + persistência após reload
      const q1 = await request.post('/api/agent/chat', {
        headers,
        data: { message: 'Quanto gastei com alimentação em novembro?', currentMonth: '2026-11' },
      });
      expect(q1.status()).toBe(200);
      const q1Json = await q1.json();
      conversationIds.add(q1Json.conversationId);
      expect(/579[,.]5/.test(q1Json.reply || '')).toBe(true);

      const q2 = await request.post('/api/agent/chat', {
        headers,
        data: { message: 'Quais são minhas três maiores despesas?', currentMonth: '2026-11' },
      });
      expect(q2.status()).toBe(200);
      const q2Json = await q2.json();
      conversationIds.add(q2Json.conversationId);
      expect(
        q2Json.toolTraces.some((t: { name: string }) =>
          ['listTransactions', 'analyzeSpending', 'getFinancialSummary'].includes(t.name)
        )
      ).toBe(true);
      expect(/aluguel|moradia|1\.?400|1\.?720/i.test(q2Json.reply || '')).toBe(true);

      const q3 = await request.post('/api/agent/chat', {
        headers,
        data: {
          message: 'Estou perto de ultrapassar meu orçamento de transporte?',
          currentMonth: '2026-11',
        },
      });
      expect(q3.status()).toBe(200);
      const q3Json = await q3.json();
      conversationIds.add(q3Json.conversationId);
      expect(q3Json.toolTraces.some((t: { name: string }) => t.name === 'listBudgets')).toBe(true);

      const q5 = await request.post('/api/agent/chat', {
        headers,
        data: { message: 'Quanto falta para minha meta de férias?', currentMonth: '2026-11' },
      });
      expect(q5.status()).toBe(200);
      const q5Json = await q5.json();
      conversationIds.add(q5Json.conversationId);
      expect(
        q5Json.toolTraces.some((t: { name: string }) => t.name === 'listFinancialGoals')
      ).toBe(true);
      expect(/1\.?300/.test(q5Json.reply || '')).toBe(true);

      // Pergunta 4: propor despesa de R$ 85,50 e confirmar no PostgreSQL
      const q4 = await request.post('/api/agent/chat', {
        headers,
        data: {
          message: `Registre uma despesa de R$ 85,50 no supermercado ${marker}, paga no Pix hoje.`,
          currentMonth: '2026-11',
        },
      });
      expect(q4.status()).toBe(200);
      const q4Json = await q4.json();
      conversationIds.add(q4Json.conversationId);
      expect(q4Json.operationProposals.length).toBe(1);
      const op = q4Json.operationProposals[0];
      expect(op.status).toBe('pending_confirmation');

      // Nada gravado antes da confirmação humana
      expect(
        (await presClient.from('transactions').select('id').eq('idempotency_key', op.idempotencyKey))
          .data
      ).toEqual([]);

      const conf1 = await request.post('/api/agent/confirm', {
        headers,
        data: { operationId: op.id, action: 'confirm' },
      });
      expect(conf1.status()).toBe(200);

      const conf2 = await request.post('/api/agent/confirm', {
        headers,
        data: { operationId: op.id, action: 'confirm' },
      });
      expect(conf2.status()).toBe(409);

      const persisted = await presClient
        .from('transactions')
        .select('id, amount, payment_method')
        .eq('idempotency_key', op.idempotencyKey)
        .single();
      expect(Number(persisted.data?.amount)).toBe(85.5);
      expect(persisted.data?.payment_method).toBe('Pix');

      // Recarregar página e verificar que o lançamento salvo pelo agente continua visível
      await page.reload();
      await nav.getByRole('button', { name: 'Extrato', exact: true }).click();
      await expect(page.getByText(new RegExp(marker))).toHaveCount(2);

      // 9. Isolamento: cliente anônimo não lê nenhum dado da conta demonstrativa
      const anon = makeClient();
      expect((await anon.from('transactions').select('id')).data).toEqual([]);
      expect((await anon.from('budgets').select('id')).data).toEqual([]);
      expect((await anon.from('financial_goals').select('id')).data).toEqual([]);

      // Se existir segunda conta de QA opcional no ambiente, confirmar isolamento cruzado
      if (process.env.E2E_USER_B_EMAIL && process.env.E2E_USER_B_PASSWORD) {
        const userB = makeClient();
        await userB.auth.signInWithPassword({
          email: process.env.E2E_USER_B_EMAIL,
          password: process.env.E2E_USER_B_PASSWORD,
        });
        expect(
          (await userB.from('transactions').select('id').eq('id', persisted.data!.id)).data
        ).toEqual([]);
        await userB.auth.signOut();
      }
    } finally {
      // Remove apenas registros temporários criados pelo smoke test (preserva todo o seed!)
      await presClient.from('transactions').delete().ilike('description', `%${marker}%`);
      if (smokeGoalId) {
        await presClient.from('financial_goals').delete().eq('id', smokeGoalId);
      }
      for (const id of conversationIds) {
        await presClient.from('agent_conversations').delete().eq('id', id);
      }
      await presClient.auth.signOut();
    }
  });
});
