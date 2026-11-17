import React from 'react';
import {
  Utensils,
  Home,
  Car,
  Sparkles,
  HeartPulse,
  GraduationCap,
  Wallet,
  Receipt,
  MoreHorizontal,
  CreditCard,
  ShoppingBag,
  DollarSign,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'Alimentação':
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Moradia':
    case 'Home':
      return <Home className={className} />;
    case 'Transporte':
    case 'Car':
      return <Car className={className} />;
    case 'Lazer & Cultura':
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Saúde & Cuidados':
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Educação':
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Salário & Renda':
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Serviços & Contas':
    case 'Receipt':
      return <Receipt className={className} />;
    case 'Cartão':
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'DollarSign':
      return <DollarSign className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};
