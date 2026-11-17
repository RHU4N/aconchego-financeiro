import React from 'react';
import {
  Plus,
  Receipt,
  Sparkles,
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  Camera,
} from 'lucide-react';
import { ActiveTab } from '../types/finance';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewTransaction: () => void;
  onOpenReceipts: () => void;
  receiptCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewTransaction,
  receiptCount,
}) => {
  return (
    <>
      {/* Desktop, Tablet & Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E9E5DC]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-5 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 md:gap-3">
          {/* Zone 1: Brand title wordmark */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => onTabChange('overview')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#274A3C] flex items-center justify-center text-[#C4EBD8] shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4EBD8]" />
              </div>
              {/* Responsive brand name: shorter on tablet portrait to prevent header squeeze */}
              <span className="text-base sm:text-lg md:text-base lg:text-xl font-bold tracking-tight text-[#1A1C1A] whitespace-nowrap">
                <span className="inline lg:hidden">Aconchego</span>
                <span className="hidden lg:inline">Aconchego Finanças</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation links (adapted for tablet md:flex and desktop lg:flex) */}
          <nav className="hidden md:flex items-center gap-1.5 md:gap-2.5 lg:gap-6 text-xs lg:text-sm font-medium">
            <button
              onClick={() => onTabChange('overview')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => onTabChange('transactions')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              Extrato
            </button>
            <button
              onClick={() => onTabChange('scan')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 flex items-center gap-1 cursor-pointer ${
                activeTab === 'scan'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear</span>
            </button>
            <button
              onClick={() => onTabChange('budgets')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 cursor-pointer ${
                activeTab === 'budgets'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              Orçamentos
            </button>
            <button
              onClick={() => onTabChange('piggybanks')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 cursor-pointer ${
                activeTab === 'piggybanks'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              Cofrinhos
            </button>
            <button
              onClick={() => onTabChange('receipts')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 px-1.5 py-1 flex items-center gap-1 cursor-pointer ${
                activeTab === 'receipts'
                  ? 'text-[#274A3C] border-[#274A3C] font-semibold'
                  : 'text-[#5C6661] border-transparent hover:text-[#1A1C1A]'
              }`}
            >
              <span>Comprovantes</span>
              {receiptCount > 0 && (
                <span className="text-[10px] lg:text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-[#3F6253]/10 text-[#274A3C]">
                  {receiptCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Actions (scaled for mobile, tablet, and desktop) */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
            <button
              onClick={onNewTransaction}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 lg:px-4 py-1.5 sm:py-2 text-xs lg:text-sm font-semibold text-white bg-[#274A3C] hover:bg-[#1E3B30] rounded-full shadow-sm transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
              <span className="hidden lg:inline">Nova Transação</span>
              <span className="lg:hidden">Novo</span>
            </button>

            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-[#E9E5DC] overflow-hidden bg-[#EAE6DE] shrink-0"
              title="Perfil de Beatriz Medeiros"
            >
              <img
                src="/src/assets/images/user_profile_avatar_1791335301763.jpg"
                alt="Beatriz Medeiros"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Thumb-Friendly Mobile Bottom Navigation Bar (hidden on tablet md+ and desktop) */}
      <nav
        aria-label="Navegação Principal Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#EAE6DE] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(39,74,60,0.06)]"
      >
        <div className="grid grid-cols-6 h-14 max-w-lg mx-auto px-0.5">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'overview' ? 'bg-[#EEF3F0]' : ''
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="truncate">Início</span>
          </button>

          <button
            onClick={() => onTabChange('transactions')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'transactions' ? 'bg-[#EEF3F0]' : ''
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="truncate">Extrato</span>
          </button>

          <button
            onClick={() => onTabChange('scan')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === 'scan'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'scan'
                  ? 'bg-[#274A3C] text-white'
                  : 'bg-[#E0835D]/15 text-[#954827]'
              }`}
            >
              <Camera className="w-4 h-4" />
            </div>
            <span className="truncate">Escanear</span>
          </button>

          <button
            onClick={() => onTabChange('budgets')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === 'budgets'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'budgets' ? 'bg-[#EEF3F0]' : ''
              }`}
            >
              <PieChart className="w-4 h-4" />
            </div>
            <span className="truncate">Limites</span>
          </button>

          <button
            onClick={() => onTabChange('piggybanks')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === 'piggybanks'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'piggybanks' ? 'bg-[#EEF3F0]' : ''
              }`}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
            <span className="truncate">Metas</span>
          </button>

          <button
            onClick={() => onTabChange('receipts')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors cursor-pointer relative ${
              activeTab === 'receipts'
                ? 'text-[#274A3C] font-bold'
                : 'text-[#5C6661] hover:text-[#1A1C1A]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors relative ${
                activeTab === 'receipts' ? 'bg-[#EEF3F0]' : ''
              }`}
            >
              <Receipt className="w-4 h-4" />
              {receiptCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#274A3C] text-[#C4EBD8] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {receiptCount}
                </span>
              )}
            </div>
            <span className="truncate">Recibos</span>
          </button>
        </div>
      </nav>
    </>
  );
};
