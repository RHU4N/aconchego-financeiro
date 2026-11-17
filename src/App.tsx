import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { PiggyBanksView } from './components/PiggyBanksView';
import { ReceiptsGalleryView } from './components/ReceiptsGalleryView';
import { ScanReceiptView } from './components/ScanReceiptView';
import { TransactionModal } from './components/TransactionModal';
import { PiggyBankModal } from './components/PiggyBankModal';
import { BudgetModal } from './components/BudgetModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import {
  DEFAULT_BUDGETS,
  INITIAL_GOALS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import {
  ActiveTab,
  CategoryBudget,
  PiggyBankGoal,
  Transaction,
  TransactionType,
} from './types/finance';
import { RotateCcw } from 'lucide-react';

const STORAGE_KEY_TRANSACTIONS = 'aconchego_financas_txs_v1';
const STORAGE_KEY_BUDGETS = 'aconchego_financas_budgets_v1';
const STORAGE_KEY_GOALS = 'aconchego_financas_goals_v1';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Budgets State
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BUDGETS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BUDGETS;
  });

  // Goals State
  const [goals, setGoals] = useState<PiggyBankGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GOALS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GOALS;
  });

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error(e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals]);

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [defaultImageUrl, setDefaultImageUrl] = useState<string>('');

  // Piggy Bank Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PiggyBankGoal | null>(null);
  const [goalModalMode, setGoalModalMode] = useState<'edit' | 'deposit' | 'withdraw'>('edit');

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  // Lightbox Modal State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    title?: string;
    transaction?: Transaction | null;
  }>({ isOpen: false });

  // Reset Confirmation State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Handlers for Transactions
  const handleOpenNewTransaction = (type: TransactionType = 'expense', prefillImg: string = '') => {
    setEditingTransaction(null);
    setDefaultTxType(type);
    setDefaultImageUrl(prefillImg);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (txData.id) {
      // Update existing
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? { ...t, ...txData, id: txData.id, createdAt: t.createdAt }
            : t
        )
      );
    } else {
      // Create new
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleAutoRegisterExpense = (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTxStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'paid' ? 'pending' : 'paid' }
          : t
      )
    );
  };

  // Handlers for Goals / Piggy Banks
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setGoalModalMode('edit');
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: PiggyBankGoal) => {
    setEditingGoal(goal);
    setGoalModalMode('edit');
    setIsGoalModalOpen(true);
  };

  const handleDepositGoal = (goal: PiggyBankGoal) => {
    setEditingGoal(goal);
    setGoalModalMode('deposit');
    setIsGoalModalOpen(true);
  };

  const handleWithdrawGoal = (goal: PiggyBankGoal) => {
    setEditingGoal(goal);
    setGoalModalMode('withdraw');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (goal: PiggyBankGoal) => {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goal.id);
      if (exists) {
        return prev.map((g) => (g.id === goal.id ? goal : g));
      }
      return [...prev, goal];
    });
  };

  const handleUpdateGoalAmount = (goalId: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newAmount = Math.max(0, g.currentAmount + delta);
        return { ...g, currentAmount: newAmount };
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Handlers for Budgets
  const handleOpenNewBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleEditBudget = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (budget: CategoryBudget) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === budget.category);
      if (exists) {
        return prev.map((b) => (b.category === budget.category ? budget : b));
      }
      return [...prev, budget];
    });
  };

  // Handlers for Lightbox / Images
  const handleViewReceipt = (tx: Transaction) => {
    if (tx.imageUrl) {
      setLightboxState({
        isOpen: true,
        imageUrl: tx.imageUrl,
        title: tx.description,
        transaction: tx,
      });
    }
  };

  const handleViewGoalImage = (goal: PiggyBankGoal) => {
    if (goal.imageUrl) {
      setLightboxState({
        isOpen: true,
        imageUrl: goal.imageUrl,
        title: goal.title,
        transaction: null,
      });
    }
  };

  // Reset demo data handler
  const handleExecuteReset = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(DEFAULT_BUDGETS);
    setGoals(INITIAL_GOALS);
    try {
      localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEY_BUDGETS);
      localStorage.removeItem(STORAGE_KEY_GOALS);
    } catch (e) {
      console.error(e);
    }
  };

  const receiptCount = transactions.filter((t) => Boolean(t.imageUrl)).length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1C1A] flex flex-col font-sans selection:bg-[#3F6253]/15">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTransaction={() => handleOpenNewTransaction('expense')}
        onOpenReceipts={() => setActiveTab('receipts')}
        receiptCount={receiptCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 md:pb-10">
        {activeTab === 'overview' && (
          <DashboardView
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onNewTransaction={handleOpenNewTransaction}
            onOpenScanReceipt={() => setActiveTab('scan')}
            onViewAllTransactions={() => setActiveTab('transactions')}
            onViewAllGoals={() => setActiveTab('piggybanks')}
            onViewReceipt={handleViewReceipt}
            onQuickDeposit={handleDepositGoal}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onNewTransaction={() => handleOpenNewTransaction('expense')}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleTxStatus}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'scan' && (
          <ScanReceiptView
            onAutoRegisterExpense={handleAutoRegisterExpense}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onGoToTransactions={() => setActiveTab('transactions')}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            currentMonth={currentMonth}
            onEditBudget={handleEditBudget}
            onNewBudget={handleOpenNewBudget}
          />
        )}

        {activeTab === 'piggybanks' && (
          <PiggyBanksView
            goals={goals}
            onNewGoal={handleOpenNewGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onDeposit={handleDepositGoal}
            onWithdraw={handleWithdrawGoal}
            onViewImage={handleViewGoalImage}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsGalleryView
            transactions={transactions}
            onViewReceipt={handleViewReceipt}
            onNewTransactionWithImage={(imageUrl) =>
              handleOpenNewTransaction('expense', imageUrl)
            }
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        defaultType={defaultTxType}
        defaultImageUrl={defaultImageUrl}
      />

      <PiggyBankModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
        onUpdateAmount={handleUpdateGoalAmount}
        initialGoal={editingGoal}
        mode={goalModalMode}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        initialBudget={editingBudget}
      />

      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ isOpen: false })}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        transaction={lightboxState.transaction}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-[#EAE6DE] py-5 pb-20 md:py-6 md:pb-6 bg-[#FAF9F6] text-xs text-[#5C6661]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} Aconchego Finanças · Controle financeiro pessoal simples e acolhedor.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-[#5C6661] hover:text-[#1A1C1A] flex items-center gap-1.5 cursor-pointer underline transition-colors"
              title="Restaurar dados de teste iniciais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados de exemplo</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Dados de Exemplo"
        description="Deseja restaurar todos os lançamentos, limites e cofrinhos para o estado de demonstração inicial? Todas as alterações personalizadas serão reiniciadas."
        confirmLabel="Sim, Restaurar"
        cancelLabel="Cancelar"
        isDestructive={false}
        iconType="reset"
        onConfirm={() => {
          handleExecuteReset();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
