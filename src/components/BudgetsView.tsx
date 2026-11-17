import React from 'react';
import { Plus, SlidersHorizontal, AlertCircle, CheckCircle } from 'lucide-react';
import { CategoryBudget, Transaction } from '../types/finance';
import { formatCurrency, getMonthLabel } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currentMonth: string;
  onEditBudget: (budget: CategoryBudget) => void;
  onNewBudget: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  currentMonth,
  onEditBudget,
  onNewBudget,
}) => {
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && (currentMonth === 'all' ? true : t.date.startsWith(currentMonth))
  );

  const expensesByCategory: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpentInBudgeted = budgets.reduce(
    (acc, b) => acc + (expensesByCategory[b.category] || 0),
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-7 pb-10">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1A1C1A]">
            Orçamentos por Categoria
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6661] mt-0.5">
            Planejamento de gastos conscientes para {getMonthLabel(currentMonth).toLowerCase()}.
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#274A3C] hover:bg-[#1E3B30] rounded-full shadow-sm transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Novo Limite</span>
        </button>
      </div>

      {/* Overview Card: 3 columns on tablet and desktop */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#FFFFFF] border border-[#EAE6DE] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 items-center">
        <div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#5C6661] uppercase tracking-wider">
            Total Orçado no Mês
          </span>
          <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#1A1C1A] mt-1 font-mono tabular-nums break-words">
            {formatCurrency(totalBudgeted)}
          </p>
          <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5">
            Soma dos tetos estipulados
          </p>
        </div>

        <div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#5C6661] uppercase tracking-wider">
            Total Já Gasto
          </span>
          <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#C96846] mt-1 font-mono tabular-nums break-words">
            {formatCurrency(totalSpentInBudgeted)}
          </p>
          <p className="text-[11px] sm:text-xs text-[#5C6661] mt-0.5">
            {totalBudgeted > 0
              ? `${((totalSpentInBudgeted / totalBudgeted) * 100).toFixed(0)}% do orçamento total consumido`
              : 'Sem orçamentos definidos'}
          </p>
        </div>

        <div className="bg-[#FAF9F6] p-3.5 sm:p-4 rounded-xl border border-[#EAE6DE]">
          <div className="flex items-center justify-between text-xs font-medium text-[#5C6661] mb-1.5">
            <span>Disponível</span>
            <span className="font-bold text-[#274A3C] font-mono tabular-nums">
              {formatCurrency(Math.max(0, totalBudgeted - totalSpentInBudgeted))}
            </span>
          </div>
          <div className="h-2 w-full bg-[#EAE6DE] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalSpentInBudgeted > totalBudgeted ? 'bg-[#BA1A1A]' : 'bg-[#3F6253]'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Category Budgets: 2 cols on tablet, 3 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
        {budgets.map((b) => {
          const spent = expensesByCategory[b.category] || 0;
          const remaining = b.limit - spent;
          const percent = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
          const isOver = spent > b.limit;
          const isNear = percent >= 85 && !isOver;

          return (
            <div
              key={b.category}
              className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#EAE6DE] shadow-xs flex flex-col justify-between hover:border-[#3F6253]/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${b.color}15`, color: b.color }}
                    >
                      <CategoryIcon name={b.category} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-[#1A1C1A] truncate">
                        {b.category}
                      </h3>
                      <span className="text-xs text-[#5C6661]">
                        Teto: {formatCurrency(b.limit)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditBudget(b)}
                    className="p-1.5 text-[#5C6661] hover:text-[#1A1C1A] hover:bg-[#F2EFE9] rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Editar limite"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3 sm:mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#5C6661]">
                      Gasto: <span className="text-[#1A1C1A] font-mono tabular-nums">{formatCurrency(spent)}</span>
                    </span>
                    <span
                      className={`font-mono tabular-nums ${
                        isOver
                          ? 'text-[#BA1A1A]'
                          : isNear
                          ? 'text-[#E0835D]'
                          : 'text-[#437A5B]'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-[#F2EFE9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-[#BA1A1A]'
                          : isNear
                          ? 'bg-[#E0835D]'
                          : 'bg-[#437A5B]'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-3.5 pt-3 border-t border-[#F5F3ED] flex items-center justify-between text-xs gap-2">
                <div className="min-w-0">
                  {isOver ? (
                    <span className="flex items-center gap-1.5 text-[#BA1A1A] font-medium truncate">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Estourou em {formatCurrency(Math.abs(remaining))}</span>
                    </span>
                  ) : isNear ? (
                    <span className="flex items-center gap-1.5 text-[#E0835D] font-medium truncate">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Restam {formatCurrency(remaining)}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#437A5B] font-medium truncate">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Restam {formatCurrency(remaining)}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onEditBudget(b)}
                  className="text-xs font-semibold text-[#3F6253] hover:underline cursor-pointer shrink-0"
                >
                  Ajustar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
