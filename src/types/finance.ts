export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 
  | 'Cartão de Crédito'
  | 'Conta Corrente'
  | 'Pix'
  | 'Dinheiro'
  | 'Boleto';

export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  account: PaymentMethod;
  status: TransactionStatus;
  imageUrl?: string; // Direct link to receipt / photo / image
  notes?: string;
  createdAt: number;
}

export interface CategoryBudget {
  category: string;
  limit: number;
  icon: string;
  color: string;
  bgColor: string;
}

export interface PiggyBankGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  imageUrl?: string;
  notes?: string;
  color: string;
}

export type ActiveTab = 'overview' | 'transactions' | 'scan' | 'budgets' | 'piggybanks' | 'receipts';

export interface ScannedReceiptResult {
  documentType: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  account: PaymentMethod;
  status: TransactionStatus;
  notes: string;
  confidence: 'alta' | 'media' | 'baixa';
}

export interface FilterState {
  search: string;
  type: 'all' | 'expense' | 'income';
  category: string;
  period: string; // 'all' or 'YYYY-MM'
  status: 'all' | 'paid' | 'pending';
}
