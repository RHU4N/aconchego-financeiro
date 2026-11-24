/**
 * Script idempotente para popular a conta demonstrativa de apresentação
 * (24/11/2026) usando exclusivamente Supabase Auth + RLS com JWT do usuário.
 *
 * Uso:
 *   PRES_USER_EMAIL=... PRES_USER_PASSWORD=... npm run seed:presentation
 *
 * Nunca grava credenciais no código e não altera outros usuários.
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface SeedTx {
  key: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paymentMethod: 'Cartão de Crédito' | 'Conta Corrente' | 'Pix' | 'Dinheiro' | 'Boleto';
  status: 'paid' | 'pending';
  notes: string;
  withReceipt?: boolean;
}

interface SeedBudget {
  category: string;
  limit: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface SeedGoal {
  title: string;
  targetAmount: number;
  targetDate: string;
  notes: string;
  color: string;
  contributions: Array<{
    key: string;
    type: 'deposit' | 'withdraw';
    amount: number;
    notes: string;
  }>;
}

const DEMO_TAG = '[DEMO-APRESENTACAO]';

const TRANSACTIONS: SeedTx[] = [
  // Outubro de 2026 (14 lançamentos efetivados: +5.280,00 / -3.148,00 = +2.132,00)
  { key: 'pres-2026-tx-01', description: 'Salário mensal — Outubro', amount: 4500.0, type: 'income', category: 'Salário & Renda', date: '2026-10-05', paymentMethod: 'Conta Corrente', status: 'paid', notes: `${DEMO_TAG} Remuneração fixa outubro` },
  { key: 'pres-2026-tx-02', description: 'Projeto freelancer UI', amount: 780.0, type: 'income', category: 'Salário & Renda', date: '2026-10-18', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Entrega protótipo interface` },
  { key: 'pres-2026-tx-03', description: 'Aluguel apartamento (Out)', amount: 1400.0, type: 'expense', category: 'Moradia', date: '2026-10-05', paymentMethod: 'Conta Corrente', status: 'paid', notes: `${DEMO_TAG} Moradia mensal outubro` },
  { key: 'pres-2026-tx-04', description: 'Condomínio mensal (Out)', amount: 320.0, type: 'expense', category: 'Moradia', date: '2026-10-08', paymentMethod: 'Boleto', status: 'paid', notes: `${DEMO_TAG} Taxa condominial outubro` },
  { key: 'pres-2026-tx-05', description: 'Supermercado Bom Preço (Out)', amount: 389.4, type: 'expense', category: 'Alimentação', date: '2026-10-10', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Compras da casa outubro` },
  { key: 'pres-2026-tx-06', description: 'Feira orgânica da semana (Out)', amount: 118.6, type: 'expense', category: 'Alimentação', date: '2026-10-16', paymentMethod: 'Dinheiro', status: 'paid', notes: `${DEMO_TAG} Hortifruti semanal` },
  { key: 'pres-2026-tx-07', description: 'Restaurante almoço equipe (Out)', amount: 94.0, type: 'expense', category: 'Alimentação', date: '2026-10-22', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Refeição fora` },
  { key: 'pres-2026-tx-08', description: 'Recarga bilhete transporte (Out)', amount: 180.0, type: 'expense', category: 'Transporte', date: '2026-10-04', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Mobilidade urbana` },
  { key: 'pres-2026-tx-09', description: 'Corridas aplicativo (Out)', amount: 92.5, type: 'expense', category: 'Transporte', date: '2026-10-20', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Deslocamentos noturnos` },
  { key: 'pres-2026-tx-10', description: 'Internet fibra óptica (Out)', amount: 119.9, type: 'expense', category: 'Serviços & Contas', date: '2026-10-10', paymentMethod: 'Boleto', status: 'paid', notes: `${DEMO_TAG} Plano banda larga residencial` },
  { key: 'pres-2026-tx-11', description: 'Energia elétrica (Out)', amount: 152.3, type: 'expense', category: 'Serviços & Contas', date: '2026-10-25', paymentMethod: 'Boleto', status: 'paid', notes: `${DEMO_TAG} Conta de luz outubro` },
  { key: 'pres-2026-tx-12', description: 'Assinatura streaming vídeo (Out)', amount: 39.9, type: 'expense', category: 'Serviços & Contas', date: '2026-10-11', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Assinatura mensal` },
  { key: 'pres-2026-tx-13', description: 'Farmácia medicamentos (Out)', amount: 76.4, type: 'expense', category: 'Saúde & Cuidados', date: '2026-10-14', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Cuidados e vitaminas` },
  { key: 'pres-2026-tx-14', description: 'Cinema e livraria (Out)', amount: 165.0, type: 'expense', category: 'Lazer & Cultura', date: '2026-10-24', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Lazer cultural outubro` },

  // Novembro de 2026 (3 receitas + 12 despesas pagas + 2 despesas pendentes = 17 lançamentos)
  // Receitas pagas: 4.500,00 + 850,00 + 320,00 = 5.670,00
  // Despesas pagas: 3.117,40 | Saldo pago novembro: +2.552,60 | Saldo geral efetivado: +4.684,60
  { key: 'pres-2026-tx-15', description: 'Salário mensal — Novembro', amount: 4500.0, type: 'income', category: 'Salário & Renda', date: '2026-11-05', paymentMethod: 'Conta Corrente', status: 'paid', notes: `${DEMO_TAG} Remuneração fixa novembro` },
  { key: 'pres-2026-tx-16', description: 'Trabalho freelancer consultoria', amount: 850.0, type: 'income', category: 'Salário & Renda', date: '2026-11-12', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Consultoria técnica` },
  { key: 'pres-2026-tx-17', description: 'Renda extra revisão de textos', amount: 320.0, type: 'income', category: 'Salário & Renda', date: '2026-11-20', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Revisão acadêmica` },

  { key: 'pres-2026-tx-18', description: 'Aluguel apartamento', amount: 1400.0, type: 'expense', category: 'Moradia', date: '2026-11-05', paymentMethod: 'Conta Corrente', status: 'paid', notes: `${DEMO_TAG} Aluguel mensal novembro` },
  { key: 'pres-2026-tx-19', description: 'Condomínio mensal', amount: 320.0, type: 'expense', category: 'Moradia', date: '2026-11-08', paymentMethod: 'Boleto', status: 'paid', notes: `${DEMO_TAG} Condomínio novembro` },
  { key: 'pres-2026-tx-20', description: 'Supermercado Primavera', amount: 347.8, type: 'expense', category: 'Alimentação', date: '2026-11-06', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Compras do mês com comprovante`, withReceipt: true },
  { key: 'pres-2026-tx-21', description: 'Hortifruti e padaria', amount: 142.2, type: 'expense', category: 'Alimentação', date: '2026-11-13', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Compras frescas da semana` },
  { key: 'pres-2026-tx-22', description: 'Almoço restaurante do bairro', amount: 89.5, type: 'expense', category: 'Alimentação', date: '2026-11-19', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Refeição fora` },
  { key: 'pres-2026-tx-23', description: 'Recarga transporte e combustível', amount: 210.0, type: 'expense', category: 'Transporte', date: '2026-11-04', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Mobilidade mensal` },
  { key: 'pres-2026-tx-24', description: 'Corridas aplicativo semana', amount: 75.5, type: 'expense', category: 'Transporte', date: '2026-11-17', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Trajetos até a faculdade` },
  { key: 'pres-2026-tx-25', description: 'Internet fibra óptica', amount: 119.9, type: 'expense', category: 'Serviços & Contas', date: '2026-11-10', paymentMethod: 'Boleto', status: 'paid', notes: `${DEMO_TAG} Internet residencial` },
  { key: 'pres-2026-tx-26', description: 'Assinatura streaming e música', amount: 39.9, type: 'expense', category: 'Serviços & Contas', date: '2026-11-11', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Assinatura digital` },
  { key: 'pres-2026-tx-27', description: 'Farmácia cuidados diários', amount: 82.6, type: 'expense', category: 'Saúde & Cuidados', date: '2026-11-15', paymentMethod: 'Pix', status: 'paid', notes: `${DEMO_TAG} Medicamentos e higiene` },
  { key: 'pres-2026-tx-28', description: 'Show acústico e jantar lazer', amount: 175.0, type: 'expense', category: 'Lazer & Cultura', date: '2026-11-16', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Entretenimento fim de semana` },
  { key: 'pres-2026-tx-29', description: 'Cinema e passeio cultural', amount: 115.0, type: 'expense', category: 'Lazer & Cultura', date: '2026-11-21', paymentMethod: 'Cartão de Crédito', status: 'paid', notes: `${DEMO_TAG} Ingresso e lanche` },

  // Despesas pendentes (previstas para depois da apresentação de 24/11/2026)
  { key: 'pres-2026-tx-30', description: 'Energia elétrica — venc. 26/11', amount: 148.4, type: 'expense', category: 'Serviços & Contas', date: '2026-11-26', paymentMethod: 'Boleto', status: 'pending', notes: `${DEMO_TAG} Fatura em aberto` },
  { key: 'pres-2026-tx-31', description: 'Consulta odontológica agendada', amount: 160.0, type: 'expense', category: 'Saúde & Cuidados', date: '2026-11-28', paymentMethod: 'Pix', status: 'pending', notes: `${DEMO_TAG} Retorno agendado` },
];

const BUDGETS: SeedBudget[] = [
  { category: 'Alimentação', limit: 900.0, icon: 'Utensils', color: '#E0835D', bgColor: '#FDF2EB' },
  { category: 'Transporte', limit: 320.0, icon: 'Car', color: '#4B739B', bgColor: '#EEF4F8' },
  { category: 'Moradia', limit: 1900.0, icon: 'Home', color: '#3F6253', bgColor: '#EEF3F0' },
  { category: 'Lazer & Cultura', limit: 250.0, icon: 'Sparkles', color: '#C27393', bgColor: '#FDF0F5' },
  { category: 'Saúde & Cuidados', limit: 300.0, icon: 'HeartPulse', color: '#528F75', bgColor: '#EFF6F2' },
  { category: 'Serviços & Contas', limit: 350.0, icon: 'Receipt', color: '#C96846', bgColor: '#FCF1ED' },
];

const GOALS: SeedGoal[] = [
  {
    title: 'Reserva de Emergência',
    targetAmount: 10000.0,
    targetDate: '2027-06-30',
    notes: `${DEMO_TAG} Meta de tranquilidade equivalente a 6 meses essenciais`,
    color: '#3F6253',
    contributions: [
      { key: 'pres-2026-gc-01', type: 'deposit', amount: 3200.0, notes: `${DEMO_TAG} Aporte inicial da reserva` },
      { key: 'pres-2026-gc-02', type: 'deposit', amount: 1200.0, notes: `${DEMO_TAG} Poupança de outubro` },
      { key: 'pres-2026-gc-03', type: 'deposit', amount: 1400.0, notes: `${DEMO_TAG} Poupança de novembro` },
    ],
  },
  {
    title: 'Viagem de Férias',
    targetAmount: 3000.0,
    targetDate: '2027-01-20',
    notes: `${DEMO_TAG} Viagem acadêmica e descanso de verão`,
    color: '#E0835D',
    contributions: [
      { key: 'pres-2026-gc-04', type: 'deposit', amount: 1100.0, notes: `${DEMO_TAG} Reserva para passagens` },
      { key: 'pres-2026-gc-05', type: 'deposit', amount: 750.0, notes: `${DEMO_TAG} Complemento freelancer` },
      { key: 'pres-2026-gc-06', type: 'withdraw', amount: 150.0, notes: `${DEMO_TAG} Taxa antecipada de hospedagem` },
    ],
  },
  {
    title: 'Notebook Novo',
    targetAmount: 4500.0,
    targetDate: '2027-04-15',
    notes: `${DEMO_TAG} Equipamento para projetos e estudos`,
    color: '#4B739B',
    contributions: [
      { key: 'pres-2026-gc-07', type: 'deposit', amount: 900.0, notes: `${DEMO_TAG} Primeiro depósito` },
      { key: 'pres-2026-gc-08', type: 'deposit', amount: 600.0, notes: `${DEMO_TAG} Economia mensal` },
    ],
  },
];

async function run() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const email = (process.env.PRES_USER_EMAIL || '').trim();
  const password = (process.env.PRES_USER_PASSWORD || '').trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
  if (!email || !password) {
    throw new Error('Defina PRES_USER_EMAIL e PRES_USER_PASSWORD no ambiente.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !authData.user || !authData.session) {
    throw new Error(`Falha ao autenticar conta demonstrativa: ${authErr?.message || 'sem sessão'}`);
  }
  const userId = authData.user.id;

  // 1. Comprovante privado sintético no bucket receipts
  const samplePath = path.resolve(process.cwd(), 'docs/samples/comprovante-supermercado-primavera.png');
  const fileBuffer = fs.readFileSync(samplePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const storagePath = `${userId}/pres-supermercado-primavera.png`;

  const { error: uploadErr } = await supabase.storage
    .from('receipts')
    .upload(storagePath, fileBuffer, { contentType: 'image/png', upsert: true });
  if (uploadErr) {
    throw new Error(`Falha no upload do comprovante sintético: ${uploadErr.message}`);
  }

  let { data: receiptRow, error: receiptFindErr } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', userId)
    .eq('file_hash', fileHash)
    .maybeSingle();
  if (receiptFindErr) throw new Error(receiptFindErr.message);

  if (!receiptRow) {
    const { data: insertedReceipt, error: receiptInsErr } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        storage_path: storagePath,
        file_hash: fileHash,
        mime_type: 'image/png',
        document_type: 'Cupom Fiscal (Demo)',
        extracted_payload: {
          description: 'Supermercado Primavera',
          amount: 347.8,
          date: '2026-11-06',
          category: 'Alimentação',
          account: 'Pix',
          demo: true,
        },
      })
      .select('id')
      .single();
    if (receiptInsErr) throw new Error(`Erro ao registrar comprovante: ${receiptInsErr.message}`);
    receiptRow = insertedReceipt;
  }

  // 2. Transações idempotentes via (user_id, idempotency_key)
  let txInserted = 0;
  for (const tx of TRANSACTIONS) {
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('idempotency_key', tx.key)
      .maybeSingle();

    if (existing?.id) continue;

    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: userId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      payment_method: tx.paymentMethod,
      status: tx.status,
      notes: tx.notes,
      receipt_id: tx.withReceipt ? receiptRow.id : null,
      idempotency_key: tx.key,
    });
    if (txErr) throw new Error(`Erro na transação ${tx.key}: ${txErr.message}`);
    txInserted += 1;
  }

  // 3. Orçamentos via upsert (user_id, category, period)
  const { error: budgetErr } = await supabase.from('budgets').upsert(
    BUDGETS.map((b) => ({
      user_id: userId,
      category: b.category,
      period: 'monthly',
      limit_amount: b.limit,
      icon: b.icon,
      color: b.color,
      bg_color: b.bgColor,
    })),
    { onConflict: 'user_id,category,period' }
  );
  if (budgetErr) throw new Error(`Erro ao gravar orçamentos: ${budgetErr.message}`);

  // 4. Cofrinhos e movimentações históricas idempotentes
  let goalsInserted = 0;
  let contribsInserted = 0;
  for (const g of GOALS) {
    let { data: goalRow, error: goalFindErr } = await supabase
      .from('financial_goals')
      .select('id, current_amount')
      .eq('user_id', userId)
      .eq('title', g.title)
      .maybeSingle();
    if (goalFindErr) throw new Error(goalFindErr.message);

    if (!goalRow) {
      const { data: createdGoal, error: goalInsErr } = await supabase
        .from('financial_goals')
        .insert({
          user_id: userId,
          title: g.title,
          target_amount: g.targetAmount,
          current_amount: 0,
          target_date: g.targetDate,
          notes: g.notes,
          color: g.color,
        })
        .select('id, current_amount')
        .single();
      if (goalInsErr) throw new Error(`Erro ao criar cofrinho ${g.title}: ${goalInsErr.message}`);
      goalRow = createdGoal;
      goalsInserted += 1;
    }

    for (const c of g.contributions) {
      const { data: existingContrib } = await supabase
        .from('goal_contributions')
        .select('id')
        .eq('user_id', userId)
        .eq('idempotency_key', c.key)
        .maybeSingle();
      if (existingContrib?.id) continue;

      const { error: contribErr } = await supabase.from('goal_contributions').insert({
        user_id: userId,
        goal_id: goalRow.id,
        type: c.type,
        amount: c.amount,
        notes: c.notes,
        idempotency_key: c.key,
      });
      if (contribErr) throw new Error(`Erro na contribuição ${c.key}: ${contribErr.message}`);
      contribsInserted += 1;
    }
  }

  // Resumo final lido do próprio banco
  const [txTotal, budgetTotal, goalTotal, contribTotal, receiptTotal] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('financial_goals').select('title, current_amount, target_amount').eq('user_id', userId),
    supabase.from('goal_contributions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  await supabase.auth.signOut();

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        insertedThisRun: {
          transactions: txInserted,
          goals: goalsInserted,
          contributions: contribsInserted,
        },
        totalsInPostgres: {
          transactions: txTotal.count,
          budgets: budgetTotal.count,
          goals: goalTotal.data,
          contributions: contribTotal.count,
          receipts: receiptTotal.count,
        },
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error('Erro no seed da apresentação:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
