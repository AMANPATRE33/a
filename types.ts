
export enum CrowdStatus {
  FREE = 'FREE',
  MODERATE = 'MODERATE',
  CROWDED = 'CROWDED'
}

export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string; // Added email field
  name: string;
  role: UserRole;
}

export interface CafeteriaStatus {
  people_inside: number;
  status: CrowdStatus;
  is_actual: boolean;
}


export interface TableStatus {
  occupied_tables: number;
  empty_tables: number;
  is_actual: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Snacks' | 'Meals' | 'Beverages';
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Receipt {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  paymentMethod: string;
  status: PaymentStatus;
}

export interface Feedback {
  id: string;
  user_name: string;
  user_email: string;
  rating: number;
  message: string;
  timestamp: number;
  type: string;
}

export interface AnalyticsData {
  total_revenue: number;
  item_sales: { name: string; value: number }[];
  avg_rating: number;
  top_items: { name: string; rating: number; image?: string; category: string }[];
  revenue_trend: { label: string; value: number }[]; // For Line Chart
  category_split: { label: string; value: number; color: string }[]; // For Pie Chart
  occupancy_trend: { label: string; value: number }[]; // For Bar Chart
  peak_hours: string; // NEW: e.g., "12PM - 2PM"
  unpopular_items: { name: string; value: number }[]; // NEW: Items with low sales
}

export interface SmartInsights {
  wait_trend: 'RISING' | 'STABLE' | 'FALLING';
  best_time_to_visit: string;
  recommended_items: MenuItem[];
  loyalty_score: number; // 0-100 based on visits
}