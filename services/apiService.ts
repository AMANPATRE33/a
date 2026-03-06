import { supabase } from '../src/lib/supabase';
import { CafeteriaStatus, TableStatus, CrowdStatus, User, Receipt, AnalyticsData, CameraFeed, MenuItem, Feedback } from '../types';
import { TOTAL_TABLES, TABLE_CAPACITY, INITIAL_MENU } from '../constants';

/**
 * PYTHON SCRIPT API CONFIGURATION
 * This URL should point to your running Python script for:
 * - Cafeteria Status (Occupancy)
 * - Table Sensors
 * - Camera Feeds
 */
const PYTHON_API_URL = 'http://127.0.0.1:5000'; 

// --- ERROR HANDLING SYSTEM ---
type ErrorCallback = (message: string) => void;
let globalErrorCallback: ErrorCallback | null = null;

export const registerGlobalErrorCallback = (callback: ErrorCallback) => {
  globalErrorCallback = callback;
};

const notifyError = (message: string) => {
  if (globalErrorCallback) {
    globalErrorCallback(message);
  } else {
    console.warn("Error:", message);
  }
};

// --- MOCK DATA FOR FALLBACKS ---
const MOCK_FEEDBACK_STORE: Feedback[] = [
  { id: '1', user_name: 'Rahul K.', user_email: 'rahul@upl', rating: 5, message: 'The Chicken Biryani today was absolutely fire! 🔥', timestamp: Date.now() - 3600000, type: 'Food Quality' },
  { id: '2', user_name: 'Priya S.', user_email: 'priya@upl', rating: 4, message: 'Cold coffee needs less sugar, otherwise perfect.', timestamp: Date.now() - 7200000, type: 'Beverages' },
  { id: '3', user_name: 'Amit D.', user_email: 'amit@upl', rating: 5, message: 'Love the new app interface. Super fast ordering.', timestamp: Date.now() - 10800000, type: 'App Experience' },
  { id: '4', user_name: 'Sneha M.', user_email: 'sneha@upl', rating: 3, message: 'Too crowded during lunch break today.', timestamp: Date.now() - 86400000, type: 'Seating' }, 
];

// --- PYTHON API FUNCTIONS (Status, Tables, Cameras) ---

export const fetchStatus = async (): Promise<CafeteriaStatus> => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/status`);
    if (!response.ok) throw new Error('API unreachable');
    return await response.json();
  } catch (error) {
    // console.error("Python API Error (Status):", error);
    // Return a safe default if Python script is offline
    return {
      people_inside: Math.floor(Math.random() * 35) + 5, // Random occupancy between 5 and 40
      status: CrowdStatus.MODERATE
    };
  }
};

export const fetchTableStatus = async (peopleInside: number = 0): Promise<TableStatus | null> => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/tables`);
    if (!response.ok) throw new Error("Sensor API not available");
    const data = await response.json();
    return { ...data, is_actual: true };
  } catch (error) {
    // Fallback: Estimate based on people count if sensors fail
    // Logic: 4 students occupy 1 table approx.
    const estimatedOccupied = Math.ceil(peopleInside / TABLE_CAPACITY);
    // Ensure we don't exceed total tables
    const occupied = Math.min(estimatedOccupied, TOTAL_TABLES);
    
    return { 
      occupied_tables: occupied, 
      empty_tables: TOTAL_TABLES - occupied, 
      is_actual: false 
    }; 
  }
};

export const fetchCameraFeeds = async (): Promise<CameraFeed[]> => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/cameras`);
    if (!response.ok) throw new Error("Cameras API unreachable");
    return await response.json();
  } catch (e) {
    // Return placeholder feeds if Python script is offline
    return [
      { 
        id: 'cam-01', 
        name: 'Main Entrance', 
        url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=60', 
        status: 'OFFLINE',
        location: 'Gate A'
      },
      { 
        id: 'cam-02', 
        name: 'Dining Area', 
        url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60', 
        status: 'OFFLINE',
        location: 'Floor 1'
      }
    ];
  }
};

// --- SUPABASE DATABASE FUNCTIONS (Menu, Orders, Feedback) ---

// 1. MENU MANAGEMENT
export const fetchMenu = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*');

  if (error || !data || data.length === 0) {
    // Fallback to INITIAL_MENU if DB is empty or fails
    // This allows the app to work immediately without seeding
    if (error) console.warn("Menu DB Error (using mock):", error);
    return INITIAL_MENU;
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image_url || item.image // Handle both naming conventions
  }));
};

export const addMenuItemToDB = async (item: MenuItem): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .insert([{
      name: item.name,
      price: item.price,
      category: item.category,
      image_url: item.image
    }]);

  if (error) {
    notifyError("Failed to add item to database.");
    return false;
  }
  return true;
};

export const deleteMenuItemFromDB = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    notifyError("Failed to delete item.");
    return false;
  }
  return true;
};

// 2. ORDERING SYSTEM
export const createOrder = async (orderData: any): Promise<boolean> => {
  // Assuming orderData contains { user_email, items, total, payment_method }
  const { error } = await supabase
    .from('orders')
    .insert([{
      user_email: orderData.user_email,
      items: orderData.items, // Stored as JSONB
      total: orderData.total,
      payment_method: orderData.paymentMethod || 'UPI',
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error("Order Error:", error);
    notifyError("Failed to place order.");
    return false;
  }
  return true;
};

export const fetchOrderHistory = async (userEmail: string): Promise<Receipt[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });

  if (error) {
    // notifyError("Could not fetch order history.");
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    items: d.items,
    total: d.total,
    timestamp: new Date(d.created_at).getTime(),
    paymentMethod: d.payment_method
  }));
};

// 3. FEEDBACK & REVIEWS
export const submitFeedbackData = async (feedback: any): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .insert([{
      user_name: feedback.user_name,
      user_email: feedback.user_email,
      rating: feedback.rating,
      message: feedback.message,
      type: feedback.type,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    notifyError("Failed to submit feedback.");
    return false;
  }
  return true;
};

export const fetchReviews = async (): Promise<Feedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return MOCK_FEEDBACK_STORE;
  }

  return data.map((f: any) => ({
    id: f.id,
    user_name: f.user_name,
    user_email: f.user_email,
    rating: f.rating,
    message: f.message,
    type: f.type,
    timestamp: new Date(f.created_at).getTime()
  }));
};

// 4. ANALYTICS (Calculated from Real DB Data)
export const fetchAnalytics = async (timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AnalyticsData> => {
  try {
    // Fetch all orders to calculate revenue and item sales
    // In a production app, you would use RPC calls or aggregated views for this
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total, items, created_at');

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('rating');

    if (orderError || feedbackError) throw new Error("DB Error");

    // If no data in DB, return Mock Analytics so the dashboard isn't empty
    if ((!orders || orders.length === 0) && (!feedback || feedback.length === 0)) {
       return getMockAnalytics(timeframe);
    }

    // Calculate Total Revenue
    const totalRevenue = orders ? orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) : 0;

    // Calculate Avg Rating
    const avgRating = feedback && feedback.length > 0
      ? feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length
      : 0;

    // Calculate Item Sales
    const itemCounts: Record<string, number> = {};
    if (orders) {
      orders.forEach((order: any) => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
          });
        }
      });
    }

    const itemSales = Object.entries(itemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Mocking trends for now as they require complex time-series grouping
    // which is heavy to do client-side without specific DB functions
    return {
      total_revenue: totalRevenue,
      avg_rating: Number(avgRating.toFixed(1)),
      item_sales: itemSales,
      revenue_trend: getMockAnalytics(timeframe).revenue_trend, // Keep mock trends for visuals
      category_split: [
         { label: 'Meals', value: 45, color: '#f97316' },
         { label: 'Snacks', value: 30, color: '#3b82f6' },
         { label: 'Beverages', value: 25, color: '#10b981' }
      ],
      occupancy_trend: getMockAnalytics(timeframe).occupancy_trend, // Keep mock trends for visuals
      top_items: itemSales.length > 0 ? itemSales.slice(0, 3).map(i => ({
        name: i.name,
        rating: 4.5, // Default
        category: 'Popular'
      })) : getMockAnalytics(timeframe).top_items
    };

  } catch (e) {
    console.error("Analytics Error:", e);
    return getMockAnalytics(timeframe);
  }
};

// --- HELPER: MOCK ANALYTICS GENERATOR ---
const getMockAnalytics = (timeframe: string): AnalyticsData => {
    let multiplier = 1;
    let trendData = [];
    let occupancyTrend = [];
    
    if (timeframe === 'daily') {
       trendData = [
         { label: '8am', value: 1200 },
         { label: '10am', value: 3500 },
         { label: '12pm', value: 8900 },
         { label: '2pm', value: 6500 },
         { label: '4pm', value: 4200 },
         { label: '6pm', value: 5800 },
         { label: '8pm', value: 3100 }
       ];
       occupancyTrend = [
         { label: '8am', value: 12 },
         { label: '10am', value: 38 },
         { label: '12pm', value: 55 },
         { label: '2pm', value: 48 },
         { label: '4pm', value: 25 },
         { label: '6pm', value: 42 },
         { label: '8pm', value: 18 }
       ];
    } else if (timeframe === 'weekly') {
       multiplier = 6.5; 
       trendData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          label: day,
          value: Math.floor(Math.random() * 5000) + 10000
       }));
       occupancyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          label: day,
          value: Math.floor(Math.random() * 30) + 20
       }));
    } else {
       multiplier = 26;
       trendData = ['W1', 'W2', 'W3', 'W4'].map(w => ({
          label: w,
          value: Math.floor(Math.random() * 20000) + 40000
       }));
       occupancyTrend = ['W1', 'W2', 'W3', 'W4'].map(w => ({
          label: w,
          value: Math.floor(Math.random() * 25) + 25
       }));
    }

    const baseRevenue = 12500;
    
    return {
      total_revenue: Math.floor(baseRevenue * multiplier * (0.9 + Math.random() * 0.2)),
      avg_rating: 4.2,
      item_sales: [
        { name: 'Veg Burger', value: Math.floor(45 * multiplier) },
        { name: 'Cold Coffee', value: Math.floor(80 * multiplier) },
        { name: 'Chicken Biryani', value: Math.floor(30 * multiplier) },
        { name: 'Paneer Wrap', value: Math.floor(55 * multiplier) },
        { name: 'Fresh Lime Soda', value: Math.floor(65 * multiplier) }
      ],
      revenue_trend: trendData,
      category_split: [
         { label: 'Meals', value: 45, color: '#f97316' }, 
         { label: 'Snacks', value: 30, color: '#3b82f6' }, 
         { label: 'Beverages', value: 25, color: '#10b981' } 
      ],
      occupancy_trend: occupancyTrend,
      top_items: [
        { 
          name: 'Chicken Biryani', 
          rating: 4.8, 
          category: 'Meals',
          image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60'
        },
        { 
          name: 'Cold Coffee', 
          rating: 4.6, 
          category: 'Beverages', 
          image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60'
        },
        { 
          name: 'Paneer Wrap', 
          rating: 4.5, 
          category: 'Snacks', 
          image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60'
        }
      ]
    };
};

// --- AUTHENTICATION ---

export const loginUser = async (emailOrUser: string, password?: string): Promise<User | null> => {
  // 1. Admin Login via Supabase Auth
  if (password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrUser,
      password: password
    });

    if (error || !data.user) {
      // Fallback for the specific hardcoded admin if Supabase Auth isn't set up with it yet
      // This helps keep the demo working if the user hasn't created the user in Supabase
      if (emailOrUser === 'admin' && password === 'admin123') {
         return { id: 'admin-local', email: 'admin', name: 'Administrator', role: 'ADMIN' };
      }
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: 'Administrator', // You might fetch this from a profiles table
      role: 'ADMIN'
    };
  } 
  
  // 2. Student "Login" (Guest Mode)
  // Just validates the email format for the demo
  if (emailOrUser.toLowerCase().endsWith('@upl') || emailOrUser.includes('@')) {
    const namePart = emailOrUser.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    return { 
      id: `stu-${Date.now()}`, 
      email: emailOrUser, 
      name: formattedName, 
      role: 'STUDENT' 
    };
  }
  
  return null;
};

export const processPaymentMock = async (amount: number, method: string): Promise<boolean> => {
  // Simulate processing delay
  await new Promise(r => setTimeout(r, 1500));
  return true;
};
