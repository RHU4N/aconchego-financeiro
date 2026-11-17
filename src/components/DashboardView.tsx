import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  Receipt,
  Plus,
  ChevronRight,
  Calendar,
  Sparkles,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { CategoryBudget, PiggyBankGoal, Transaction } from '../types/finance';
import { formatCurrency, formatFriendlyDate, getMonthLabel } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: PiggyBankGoal[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onNewTransaction: (type?: 'income' | 'expense') => void;
  onOpenScanReceipt: () => void;
  onViewAllTransactions: () => void;
  onViewAllGoals: () => void;
  onViewReceipt: (transaction: Transaction) => void;
  onQuickDeposit: (goal: PiggyBankGoal) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budgets,
  goals,
  currentMonth,
  onMonthChange,
  onNewTransaction,
  onOpenScanReceipt,
  onViewAllTransactions,
  onViewAllGoals,
  onViewReceipt,
  onQuickDeposit,
}) => {
  const monthTransactions = transactions.filter((t) =>
    currentMonth === 'all' ? true : t.date.startsWith(currentMonth)
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthBalance = totalIncome - totalExpenses;

  const globalBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  const totalSavedInGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);

  const categoryExpenses: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => {
      const budget = budgets.find((b) => b.category === cat);
      return {
        category: cat,
        amount,
        percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: budget?.color || '#3F6253',
        limit: budget?.limit || 0,
      };
    });

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
    .slice(0, 5);

  const monthSet = new Set<string>(['2026-11', '2026-10', '2026-09', '2026-08']);
  transactions.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      monthSet.add(t.date.slice(0, 7));
    }
  });
  const availableMonths = [
    ...Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({ value, label: getMonthLabel(value) })),
    { value: 'all', label: 'Todo o histórico' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8 pb-10">
      {/* Welcome & Month Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1A1C1A]">
            Olá, Bia!
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6661] mt-0.5">
            Aqui está a saúde das suas contas para {getMonthLabel(currentMonth).toLowerCase()}.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-[#F2EFE9] px-2.5 py-1.5 rounded-2xl border border-[#E6E2D8] self-start sm:self-auto shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#5C6661] ml-0.5 shrink-0" />
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-[#1A1C1A] focus:outline-none cursor-pointer pr-2 py-0.5"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Summary Cards: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-4">
        {/* Card 1: Saldo Geral */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 md:p-5 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5C6661]">
              Saldo Geral Disponível
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EEF3F0] flex items-center justify-center text-[#274A3C] shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-2xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#1A1C1A] font-mono tabular-nums break-words">
              {formatCurrency(globalBalance)}
            </p>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-1">
              Contas correntes e cartões
            </p>
          </div>
        </div>

        {/* Card 2: Entradas */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 md:p-5 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5C6661]">
              Entradas do Mês
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EDF5F0] flex items-center justify-center text-[#437A5B] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-2xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#437A5B] font-mono tabular-nums break-words">
              +{formatCurrency(totalIncome)}
            </p>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-1">
              Salário e freelas recebidos
            </p>
          </div>
        </div>

        {/* Card 3: Saídas */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 md:p-5 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5C6661]">
              Saídas do Mês
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FCF1ED] flex items-center justify-center text-[#C96846] shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-2xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[#C96846] font-mono tabular-nums break-words">
              -{formatCurrency(totalExpenses)}
            </p>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-1">
              Despesas fixas e variáveis
            </p>
          </div>
        </div>

        {/* Card 4: Sobra do Mês */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 md:p-5 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5C6661]">
              Sobra Prevista no Mês
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F5F2EC] flex items-center justify-center text-[#E0835D] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p
              className={`text-2xl sm:text-2xl md:text-2xl lg:text-3xl font-bold tracking-tight font-mono tabular-nums break-words ${
                monthBalance >= 0 ? 'text-[#274A3C]' : 'text-[#BA1A1A]'
              }`}
            >
              {formatCurrency(monthBalance)}
            </p>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-1">
              {monthBalance >= 0 ? 'Pronta para guardar no cofrinho' : 'Atenção aos limites do mês'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Pills: neatly aligned on tablet and desktop */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-3">
        <button
          onClick={onOpenScanReceipt}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#274A3C] text-xs sm:text-sm font-semibold text-white hover:bg-[#1E3B30] transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Escanear Recibo / Conta</span>
        </button>
        <button
          onClick={() => onNewTransaction('expense')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#EAE6DE] text-xs sm:text-sm font-semibold text-[#C96846] hover:bg-[#FCF1ED] transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Registrar Despesa</span>
        </button>
        <button
          onClick={() => onNewTransaction('income')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#EAE6DE] text-xs sm:text-sm font-semibold text-[#437A5B] hover:bg-[#EDF5F0] transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Registrar Receita</span>
        </button>
        <button
          onClick={onViewAllGoals}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#EAE6DE] text-xs sm:text-sm font-semibold text-[#3F6253] hover:bg-[#EEF3F0] transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Ver Cofrinhos</span>
        </button>
      </div>

      {/* Middle Row: Gastos por Categoria & Metas dos Cofrinhos (side by side on tablet md:grid-cols-12 and desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 md:gap-5 lg:gap-6">
        {/* Gastos por Categoria (7 cols on tablet & desktop) */}
        <div className="md:col-span-7 bg-[#FFFFFF] p-4 sm:p-5 md:p-6 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
                  Despesas por Categoria
                </h2>
                <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5">
                  Distribuição no período ({formatCurrency(totalExpenses)})
                </p>
              </div>
              <span className="text-[11px] sm:text-xs text-[#5C6661] font-medium">
                {sortedCategories.length} categorias
              </span>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="py-10 text-center text-[#5C6661]">
                <Receipt className="w-8 h-8 mx-auto text-[#B0AAA0] mb-2" />
                <p className="text-xs sm:text-sm font-medium">Nenhuma despesa cadastrada neste mês.</p>
                <button
                  onClick={() => onNewTransaction('expense')}
                  className="mt-2 text-xs font-semibold text-[#274A3C] underline cursor-pointer"
                >
                  + Adicionar despesa
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stacked bar visualization */}
                <div className="h-3 w-full bg-[#F2EFE9] rounded-full overflow-hidden flex">
                  {sortedCategories.map((cat) => (
                    <div
                      key={cat.category}
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.category}: ${cat.percent.toFixed(1)}%`}
                      className="h-full transition-all duration-300"
                    />
                  ))}
                </div>

                {/* Category rows */}
                <div className="space-y-2.5 pt-1">
                  {sortedCategories.slice(0, 5).map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-[#F5F3ED] last:border-b-0 gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <CategoryIcon name={cat.category} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#1A1C1A] truncate block">
                            {cat.category}
                          </span>
                          <div className="text-[11px] text-[#5C6661] flex items-center gap-1">
                            <span>{cat.percent.toFixed(1)}%</span>
                            {cat.limit > 0 && (
                              <span className="hidden xs:inline sm:inline">· limite: {formatCurrency(cat.limit)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-[#1A1C1A] font-mono tabular-nums text-xs sm:text-sm">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cofrinhos em Destaque (5 cols on tablet & desktop) */}
        <div className="md:col-span-5 bg-[#FFFFFF] p-4 sm:p-5 md:p-6 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
                  Meus Cofrinhos
                </h2>
                <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5">
                  Guardado: <span className="font-semibold text-[#274A3C] font-mono tabular-nums">{formatCurrency(totalSavedInGoals)}</span>
                </p>
              </div>
              <button
                onClick={onViewAllGoals}
                className="text-xs font-semibold text-[#3F6253] hover:text-[#274A3C] flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {goals.slice(0, 2).map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );

                return (
                  <div
                    key={goal.id}
                    className="p-3 sm:p-3.5 rounded-xl border border-[#EAE6DE] bg-[#FAF9F6] relative overflow-hidden group hover:border-[#3F6253]/30 transition-all"
                  >
                    {goal.imageUrl && (
                      <div className="h-16 md:h-20 w-full rounded-lg overflow-hidden mb-2.5 bg-[#E6E2D8]">
                        <img
                          src={goal.imageUrl}
                          alt={goal.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-[#1A1C1A] truncate">
                          {goal.title}
                        </h3>
                        <p className="text-[11px] text-[#5C6661] mt-0.5 font-mono tabular-nums">
                          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#3F6253] bg-[#E3ECE7] px-2 py-0.5 rounded-full shrink-0">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-2.5 h-2 w-full bg-[#EAE6DE] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3F6253] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-[#5C6661] truncate pr-2">
                        Faltam {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      </span>
                      <button
                        onClick={() => onQuickDeposit(goal)}
                        className="font-semibold text-[#3F6253] hover:text-[#274A3C] underline cursor-pointer shrink-0"
                      >
                        + Guardar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-[#F2EFE9] mt-3">
            <div className="flex items-center gap-2 text-[11px] text-[#5C6661]">
              <ShieldCheck className="w-4 h-4 text-[#437A5B] shrink-0" />
              <span>Suas economias rendem segurança e tranquilidade.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 md:p-6 rounded-2xl border border-[#EAE6DE] shadow-xs">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
              Transações Recentes
            </h2>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5">
              Últimos lançamentos (toque no comprovante para ampliar)
            </p>
          </div>
          <button
            onClick={onViewAllTransactions}
            className="text-xs font-semibold text-[#3F6253] hover:text-[#274A3C] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver extrato</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#F2EFE9]">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] px-1 sm:px-2 md:px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-[#EDF5F0] text-[#437A5B]'
                      : 'bg-[#FCF1ED] text-[#C96846]'
                  }`}
                >
                  <CategoryIcon name={tx.category} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-[#1A1C1A] truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                      {tx.description}
                    </p>
                    {tx.imageUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewReceipt(tx);
                        }}
                        title="Ver foto do comprovante"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#3F6253] bg-[#E3ECE7] hover:bg-[#D5E3DC] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Recibo</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#5C6661] mt-0.5 flex-wrap">
                    <span>{formatFriendlyDate(tx.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{tx.category}</span>
                    <span aria-hidden="true" className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{tx.account}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3 md:gap-4">
                {tx.imageUrl && (
                  <button
                    onClick={() => onViewReceipt(tx)}
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg overflow-hidden border border-[#E6E2D8] hover:ring-2 hover:ring-[#3F6253] transition-all cursor-pointer relative shrink-0"
                    title="Ampliar comprovante"
                  >
                    <img
                      src={tx.imageUrl}
                      alt="Miniatura do recibo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                )}

                <div>
                  <p
                    className={`text-xs sm:text-sm md:text-base font-bold font-mono tabular-nums ${
                      tx.type === 'income' ? 'text-[#437A5B]' : 'text-[#1A1C1A]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <span
                    className={`text-[10px] font-medium block ${
                      tx.status === 'paid' ? 'text-[#5C6661]' : 'text-[#C96846]'
                    }`}
                  >
                    {tx.status === 'paid' ? 'Efetivado' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Friendly Helper Banner */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#F4F3F0] border border-[#E9E5DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E0835D]/15 flex items-center justify-center text-[#E0835D] shrink-0 mt-0.5">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1A1C1A]">
              Anexe comprovantes com links diretos de imagens
            </h3>
            <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5 max-w-2xl">
              Cole links diretos de fotos de recibos e cupons fiscais para arquivamento visual imediato.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNewTransaction()}
          className="text-xs font-semibold text-[#274A3C] bg-[#FFFFFF] px-3.5 py-1.5 sm:py-2 rounded-full border border-[#D9D5CC] hover:bg-[#FAF9F6] whitespace-nowrap cursor-pointer transition-colors shadow-2xs self-stretch sm:self-auto text-center"
        >
          Experimentar agora
        </button>
      </div>
    </div>
  );
};
