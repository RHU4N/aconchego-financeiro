import React, { useState, useEffect } from 'react';
import { X, Receipt, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DEFAULT_CATEGORIES, SAMPLE_RECEIPT_LINKS } from '../data/initialData';
import { PaymentMethod, Transaction, TransactionStatus, TransactionType } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultImageUrl?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  defaultType = 'expense',
  defaultImageUrl = '',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState<PaymentMethod>('Cartão de Crédito');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [imageError, setImageError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(initialTransaction.amount.toString());
      setDescription(initialTransaction.description);
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setAccount(initialTransaction.account);
      setStatus(initialTransaction.status);
      setImageUrl(initialTransaction.imageUrl || '');
      setNotes(initialTransaction.notes || '');
    } else {
      setType(defaultType);
      setAmountStr('');
      setDescription('');
      setCategory(defaultType === 'income' ? 'Salário & Renda' : 'Alimentação');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setAccount(defaultType === 'income' ? 'Conta Corrente' : 'Cartão de Crédito');
      setStatus('paid');
      setImageUrl(defaultImageUrl || '');
      setNotes('');
    }
    setImageError(false);
  }, [initialTransaction, defaultType, defaultImageUrl, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setFormError('Por favor, preencha a descrição da transação.');
      return;
    }

    onSave({
      id: initialTransaction ? initialTransaction.id : undefined,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date: date || new Date().toISOString().split('T')[0],
      account,
      status,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const paymentMethods: PaymentMethod[] = [
    'Cartão de Crédito',
    'Conta Corrente',
    'Pix',
    'Dinheiro',
    'Boleto',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-3xl border border-[#EAE6DE] shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2EFE9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E6E2D8] flex items-center justify-center text-[#274A3C]">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1C1A]">
              {initialTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
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
          {/* Error Banner */}
          {formError && (
            <div className="p-3 rounded-xl bg-[#FDF0ED] border border-[#F5C2B8] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Segmented Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2EFE9] rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Salário & Renda') setCategory('Alimentação');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-[#C96846] shadow-xs'
                  : 'text-[#5C6661] hover:text-[#1A1C1A]'
              }`}
            >
              - Despesa (Saída)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (category === 'Alimentação') setCategory('Salário & Renda');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-[#437A5B] shadow-xs'
                  : 'text-[#5C6661] hover:text-[#1A1C1A]'
              }`}
            >
              + Receita (Entrada)
            </button>
          </div>

          {/* Amount Input */}
          <div className="text-center py-1 sm:py-2">
            <label className="text-[11px] sm:text-xs font-semibold text-[#5C6661] uppercase tracking-wider block mb-1">
              Valor da Transação
            </label>
            <div className="relative inline-flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-[#5C6661] mr-1.5">R$</span>
              <input
                type="text"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                required
                className={`text-2xl sm:text-4xl font-extrabold text-center tracking-tight bg-transparent focus:outline-none w-44 sm:w-48 font-mono tabular-nums ${
                  type === 'income' ? 'text-[#437A5B]' : 'text-[#1A1C1A]'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A] cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                Forma de Pagamento
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 sm:py-2.5 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-sm focus:outline-none focus:border-[#3F6253] text-[#1A1C1A] cursor-pointer"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
                Situação
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    status === 'paid'
                      ? 'bg-[#EEF3F0] text-[#274A3C] border-[#3F6253]'
                      : 'bg-[#FAF9F6] text-[#5C6661] border-[#E6E2D8]'
                  }`}
                >
                  ✓ Efetivado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    status === 'pending'
                      ? 'bg-[#FCF1ED] text-[#C96846] border-[#E0835D]'
                      : 'bg-[#FAF9F6] text-[#5C6661] border-[#E6E2D8]'
                  }`}
                >
                  ⏳ Pendente
                </button>
              </div>
            </div>
          </div>

          {/* DIRECT IMAGE LINK FIELD */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7F6F2] border border-[#EAE6DE] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1C1A] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#3F6253]" />
                <span>Link Direto da Imagem (Comprovante)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImageError(false);
                  }}
                  className="text-[11px] text-[#BA1A1A] hover:underline cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>

            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-[#5C6661] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Cole a URL da imagem (ex: https://...)"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageError(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E6E2D8] rounded-xl focus:outline-none focus:border-[#3F6253] text-[#1A1C1A]"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-[#5C6661]">Exemplos:</span>
              <button
                type="button"
                onClick={() => {
                  setImageUrl('/src/assets/images/receipt_supermarket_sample_1791335311360.jpg');
                  setImageError(false);
                }}
                className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#D9D5CC] text-[#274A3C] hover:bg-[#FAF9F6] cursor-pointer"
              >
                Cupom Mercado
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageUrl(SAMPLE_RECEIPT_LINKS[1].url);
                  setImageError(false);
                }}
                className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#D9D5CC] text-[#274A3C] hover:bg-[#FAF9F6] cursor-pointer"
              >
                Recibo Café
              </button>
            </div>

            {/* Live preview */}
            {imageUrl && (
              <div className="mt-2 flex items-center gap-2.5 p-2 bg-[#FFFFFF] rounded-xl border border-[#E6E2D8]">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EAE6DE] shrink-0 border border-[#D9D5CC]">
                  {!imageError ? (
                    <img
                      src={imageUrl}
                      alt="Pré-visualização"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#BA1A1A] p-1 text-center">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-[#5C6661] min-w-0 flex-1">
                  <span className="font-semibold text-[#1A1C1A] block truncate">
                    {imageError ? 'Falha ao carregar' : 'Comprovante visual pronto'}
                  </span>
                  <span className="text-[10px] text-[#717974] truncate block">
                    {imageUrl}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1A1C1A] mb-1">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Anotações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E6E2D8] rounded-xl text-base sm:text-xs focus:outline-none focus:border-[#3F6253] text-[#1A1C1A] resize-none"
            />
          </div>

          {/* Buttons */}
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
              {initialTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
