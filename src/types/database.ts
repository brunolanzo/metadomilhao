export type TransactionType = 'income' | 'expense';
export type FamilyRole = 'admin' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'expired';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FamilyInvite {
  id: string;
  family_id: string;
  email: string;
  invited_by: string;
  status: InviteStatus;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  created_at: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  category_id: string;
  user_id: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  is_recurring: boolean;
  is_provisional: boolean;
  recurring_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  parent_id: string | null;
  created_at: string;
  category?: Category;
  profile?: Profile;
}

export interface Goal {
  id: string;
  family_id: string;
  target_amount: number;
  month: string; // YYYY-MM
  created_at: string;
}

export interface CategoryBudget {
  id: string;
  family_id: string;
  category_id: string;
  monthly_limit: number;
  created_at: string;
  category?: Category;
}
