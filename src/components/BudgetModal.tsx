import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../data/initialData';
import { CategoryBudget } from '../types/finance';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: CategoryBudget) => void;
  initialBudget?: CategoryBudget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBudget,
}) => {
  const [category, setCategory] = useState('Alimentação');
  const [limitStr, setLimitStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialBudget) {
      setCategory(initialBudget.category);
      setLimitStr(initialBudget.limit.toString());
    } else {
      setCategory('Alimentação');
      setLimitStr('1000');
    }
  }, [initialBudget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const limit = parseFloat(limitStr.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      setFormError('Informe um limite mensal válido maior que zero.');
      return;
    }

    const catDef = DEFAULT_CATEGORIES.find((c) => c.name === category);

    onSave({
      category,
      limit,
      icon: catDef?.icon || 'Receipt',
      color: catDef?.color || '#3F6253',
      bgColor: catDef?.bgColor || '#EEF3F0',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] w-full max-w-sm rounded-3xl border border-[#EAE6DE] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#F2EFE9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E6E2D8] flex items-center justify-center text-[#274A3C]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
              {initialBudget ? 'Ajustar Limite' : 'Novo Orçamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5C6661] hover:text-[#1A1C1A] hover:bg-[#F2EFE9] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FDF0ED] border border-[#F5C2B8] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
              Categoria
            </label>
            <select
              value={category}
              disabled={Boolean(initialBudget)}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A] cursor-pointer disabled:opacity-75"
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
              Limite Mensal de Gastos (R$)
            </label>
            <input
              type="text"
              placeholder="Ex: 1200"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-lg sm:text-xl font-bold font-mono tabular-nums text-[#1A1C1A] focus:outline-none focus:border-[#3F6253]"
            />
          </div>

          <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5C6661] hover:text-[#1A1C1A] hover:bg-[#F2EFE9] rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 sm:px-6 py-2.5 text-xs font-bold text-white bg-[#274A3C] hover:bg-[#1E3B30] rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Salvar Limite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
