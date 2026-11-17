import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { PiggyBankGoal } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface PiggyBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: PiggyBankGoal) => void;
  onUpdateAmount: (goalId: string, delta: number) => void;
  initialGoal?: PiggyBankGoal | null;
  mode?: 'edit' | 'deposit' | 'withdraw';
}

export const PiggyBankModal: React.FC<PiggyBankModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  onUpdateAmount,
  initialGoal,
  mode = 'edit',
}) => {
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [deltaStr, setDeltaStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialGoal) {
      setTitle(initialGoal.title);
      setTargetAmountStr(initialGoal.targetAmount.toString());
      setCurrentAmountStr(initialGoal.currentAmount.toString());
      setTargetDate(initialGoal.targetDate || '');
      setImageUrl(initialGoal.imageUrl || '');
      setNotes(initialGoal.notes || '');
    } else {
      setTitle('');
      setTargetAmountStr('');
      setCurrentAmountStr('0');
      setTargetDate('');
      setImageUrl('');
      setNotes('');
    }
    setDeltaStr('');
  }, [initialGoal, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'deposit' || mode === 'withdraw') {
      if (!initialGoal) return;
      const delta = parseFloat(deltaStr.replace(',', '.'));
      if (isNaN(delta) || delta <= 0) {
        setFormError('Informe um valor válido maior que zero.');
        return;
      }
      onUpdateAmount(initialGoal.id, mode === 'deposit' ? delta : -delta);
      onClose();
      return;
    }

    const targetAmount = parseFloat(targetAmountStr.replace(',', '.'));
    const currentAmount = parseFloat(currentAmountStr.replace(',', '.')) || 0;

    if (!title.trim()) {
      setFormError('Por favor, informe o título da meta.');
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setFormError('Informe um valor de meta válido maior que zero.');
      return;
    }

    const goalToSave: PiggyBankGoal = {
      id: initialGoal ? initialGoal.id : `goal-${Date.now()}`,
      title: title.trim(),
      targetAmount,
      currentAmount,
      targetDate: targetDate || undefined,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      color: initialGoal?.color || '#3F6253',
    };

    onSaveGoal(goalToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-3xl border border-[#EAE6DE] shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2EFE9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E6E2D8] flex items-center justify-center text-[#274A3C]">
              <PiggyBank className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
              {mode === 'deposit'
                ? 'Guardar Dinheiro'
                : mode === 'withdraw'
                ? 'Resgatar Dinheiro'
                : initialGoal
                ? 'Editar Cofrinho'
                : 'Novo Cofrinho'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5C6661] hover:text-[#1A1C1A] hover:bg-[#F2EFE9] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FDF0ED] border border-[#F5C2B8] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {mode === 'deposit' || mode === 'withdraw' ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-xs text-[#5C6661] block mb-1">
                  {initialGoal?.title} (Saldo atual: {formatCurrency(initialGoal?.currentAmount || 0)})
                </span>
                <div className="relative inline-flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-[#5C6661] mr-1.5">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={deltaStr}
                    onChange={(e) => setDeltaStr(e.target.value)}
                    autoFocus
                    required
                    className={`text-2xl sm:text-3xl font-extrabold text-center tracking-tight bg-transparent focus:outline-none w-44 sm:w-48 font-mono tabular-nums ${
                      mode === 'deposit' ? 'text-[#437A5B]' : 'text-[#C96846]'
                    }`}
                  />
                </div>
              </div>

              {/* Quick deposit chips */}
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDeltaStr(val.toString())}
                    className="px-3 py-1 bg-[#F2EFE9] hover:bg-[#EAE6DE] rounded-full text-xs font-semibold text-[#274A3C] transition-colors cursor-pointer"
                  >
                    + R$ {val}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Viagem, Notebook, Reserva..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                    Meta (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5000"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm font-mono tabular-nums focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                    Guardado (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={currentAmountStr}
                    onChange={(e) => setCurrentAmountStr(e.target.value)}
                    className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm font-mono tabular-nums focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                  Data Alvo (Opcional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE6DE] space-y-2">
                <label className="text-xs font-bold text-[#1A1C1A] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#3F6253]" />
                  <span>Link da Imagem de Inspiração (URL)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... ou caminho de imagem"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E6E2D8] rounded-xl focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
                />
                <div className="flex gap-2 flex-wrap text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl('/src/assets/images/goal_vacation_beach_1791335320745.jpg')
                    }
                    className="text-[#274A3C] underline cursor-pointer"
                  >
                    Foto de praia
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl('/src/assets/images/goal_emergency_reserve_1791335328368.jpg')
                    }
                    className="text-[#274A3C] underline cursor-pointer"
                  >
                    Foto de reserva
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                  Motivação / Detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Por que esse objetivo é importante..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-xs focus:outline-none focus:border-[#3F6253] text-[#1A1C1A] resize-none"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-end gap-2.5 shrink-0">
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
              {mode === 'deposit'
                ? 'Confirmar Depósito'
                : mode === 'withdraw'
                ? 'Confirmar Resgate'
                : 'Salvar Cofrinho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
