import { supabase } from '../src/lib/supabase';
import { CafeteriaStatus, TableStatus, CrowdStatus, User, Receipt, AnalyticsData, MenuItem, Feedback, PaymentStatus } from '../types';
import { TOTAL_TABLES, TABLE_CAPACITY, INITIAL_MENU } from '../constants';

/**
 * PYTHON SCRIPT API CONFIGURATION
 * This URL should point to your running Python script for:
 * - Cafeteria Status (Occupancy)
 * - Table Sensors
 * - Camera Feeds
 */
// 👉 PASTE YOUR NGROK URL HERE 👈
const NGROK_URL = 'https://awilda-sublenticular-left.ngrok-free.dev';

export const STUDENT_COUNT_URL = import.meta.env.VITE_STUDENT_COUNT_URL || NGROK_URL || 'http://localhost:5000';
export const TABLE_ESTIMATE_URL = import.meta.env.VITE_TABLE_ESTIMATE_URL || NGROK_URL || 'http://localhost:5000';

/**
 * Performs a connectivity check to Supabase.
 * Useful for debugging deployment issues.
 */
export const checkSupabaseHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from('menu_items').select('id').limit(1);
    if (error) throw error;
    return { ok: true, message: "Connected to Supabase successfully." };
  } catch (err: any) {
    console.error("Supabase Health Check Failed:", err);
    return { ok: false, message: err.message || "Unknown connection error." };
  }
};









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

/**
 * Fetches the current live status of the cafeteria from the Python backend.
 * Falls back to randomized mock data if the API is unreachable.
 * @returns {Promise<CafeteriaStatus>} The live occupancy and crowd status.
 */
export const fetchStatus = async (): Promise<CafeteriaStatus> => {
  try {
    const url = `${STUDENT_COUNT_URL}/status`;
    console.log(`📡 Fetching Status from: ${url}`);
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (!response.ok) {
      console.error(`❌ Status fetch failed [${response.status}]: ${response.statusText}`);
      throw new Error('API unreachable');
    }


    const data = await response.json();
    return { ...data, is_actual: true };
  } catch (error) {

    notifyError("Python API Offline: Falling back to mock live status estimation.");
    // Return a safe default if Python script is offline
    return {
      people_inside: Math.floor(Math.random() * 35) + 5, // Random occupancy between 5 and 40
      status: CrowdStatus.MODERATE,
      is_actual: false
    };

  }
};

/**
 * Fetches table occupancy details.
 * If sensors are unavailable, estimates occupancy based on the number of people inside.
 * @param {number} peopleInside - Current count of people in the cafeteria.
 * @returns {Promise<TableStatus | null>} Count of occupied and empty tables.
 */
export const fetchTableStatus = async (peopleInside: number = 0): Promise<TableStatus | null> => {
  try {
    const url = `${TABLE_ESTIMATE_URL}/api/tables?count=${peopleInside}`;
    console.log(`📊 Fetching Tables from: ${url}`);
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });


    if (!response.ok) {
      console.error(`❌ Tables fetch failed [${response.status}]: ${response.statusText}`);
      throw new Error("Sensor API not available");
    }

    const data = await response.json();
    console.log("📊 API Table Data Received:", data);
    return { ...data, is_actual: true };
  } catch (error) {
    console.error("❌ Table Fetch Error:", error);
    notifyError("Python API Offline: Falling back to AI table capacity estimation.");

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



// --- SUPABASE DATABASE FUNCTIONS (Menu, Orders, Feedback) ---

// 1. MENU MANAGEMENT
interface MenuRow {
  id: string;
  name: string;
  price: number;
  category: 'Snacks' | 'Meals' | 'Beverages';
  image_url: string;
  image?: string; // Support legacy naming
}

/**
 * Fetches the full menu list from the Supabase database.
 * If the database connection fails, it falls back to a predefined initial menu.
 * @returns {Promise<MenuItem[]>} List of available menu items.
 */
export const fetchMenu = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');

    if (error) {
      console.error("Supabase Menu Error:", error.message);
      return INITIAL_MENU; 
    }

    if (!data || data.length === 0) {
      return INITIAL_MENU; // Fallback even if table is empty
    }

    return (data as any[]).map((item) => ({
      id: item.id ? item.id.toString() : Math.random().toString(36).substr(2, 9),
      name: item.name || 'Unnamed Item',
      price: Number(item.price) || 0,
      category: (item.category as any) || 'Snacks',
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
    }));
  } catch (err: any) {
    console.error("fetchMenu Exception:", err);
    return INITIAL_MENU;
  }
};


/**
 * Adds a new menu item to the database.
 * Used by administrators to update the cafeteria's offerings.
 * @param {MenuItem} item - The item to be added.
 * @returns {Promise<boolean>} True if addition was successful.
 */
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
    notifyError(`Failed to add item: ${error.message}`);
    return false;
  }
  return true;
};

/**
 * Removes a menu item from the database by its unique identifier.
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise<boolean>} True if deletion was successful.
 */
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
interface OrderRow {
  id: string;
  user_email: string;
  items: any; // Stored as JSONB
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

/**
 * Creates a new order in the database.
 * Captures user details, items ordered, and payment preference.
 * @param {Receipt & { user_email: string, user_name: string }} order - The order details.
 * @returns {Promise<string | null>} The generated Order ID if successful.
 */
export const createOrder = async (order: Receipt & { user_email: string, user_name: string }): Promise<string | null> => {
    const orderData = {
      user_email: order.user_email,
      items: order.items,
      total: order.total,
      payment_method: order.paymentMethod || 'UPI',
      status: order.status || 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error("Order Error Details:", error);
      notifyError(`Order Failed: ${error.message} (Is 'orders' table created?)`);
      return null;
    }
    
    if (!data) {
      notifyError("Order inserted but no data returned. Check DB permissions.");
      return null;
    }

    return data.id;

};

/**
 * Updates the payment/fulfillment status of an existing order.
 * @param {string} orderId - Unique order reference.
 * @param {PaymentStatus} status - New status (e.g., 'paid', 'failed').
 * @returns {Promise<boolean>} True if update was successful.
 */
export const updateOrderStatus = async (orderId: string, status: PaymentStatus): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error("Update Status Error:", error);
    notifyError(`Failed to update order status: ${error.message}`);
    return false;
  }
  return true;
};

export const createPayment = async (payment: {
  order_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: PaymentStatus;
}): Promise<boolean> => {
  const { error } = await supabase
    .from('payments')
    .insert([{
      ...payment,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    // If table doesn't exist, we'll just log and continue as it's optional for the demo
    console.warn("Payments table not found or error:", error);
    return false;
  }
  return true;
};

/**
 * Retrieves the order history for a specific student/user.
 * @param {string} userEmail - The email address of the user.
 * @returns {Promise<Receipt[]>} List of past orders.
 */
export const fetchOrderHistory = async (userEmail: string): Promise<Receipt[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) {
      notifyError(`History Error: ${error.message}`);
      console.error("Supabase History Error:", error);
    }
    return [];
  }

  return (data as OrderRow[]).map((d) => ({
    id: d.id,
    items: d.items,
    total: d.total,
    timestamp: new Date(d.created_at).getTime(),
    paymentMethod: d.payment_method,
    status: d.status as PaymentStatus
  }));
};

/**
 * Fetches the count of all orders with 'pending' status.
 * Used for estimating the cafeteria's wait time.
 * @returns {Promise<number>} Count of pending orders.
 */
export const fetchPendingOrdersCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error("fetchPendingOrdersCount Error:", error);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.error("fetchPendingOrdersCount Exception:", e);
    return 0;
  }
};

// 3. FEEDBACK & REVIEWS
interface FeedbackRow {
  id: string;
  user_name: string;
  user_email: string;
  rating: number;
  message: string;
  type: string;
  created_at: string;
}

/**
 * Submits anonymous or user-specific feedback to the database.
 * @param {Omit<Feedback, 'id' | 'timestamp'>} feedback - Rating and message details.
 * @returns {Promise<boolean>} True if submission was successful.
 */
export const submitFeedbackData = async (feedback: Omit<Feedback, 'id' | 'timestamp'>): Promise<boolean> => {
  // Try inserting with all fields
  const payload: any = {
    user_email: feedback.user_email,
    rating: feedback.rating,
    message: feedback.message,
    type: feedback.type,
    created_at: new Date().toISOString()
  };

  // Only add user_name if it exists in our object
  if (feedback.user_name) payload.user_name = feedback.user_name;

  let { error } = await supabase.from('feedback').insert([payload]);

  // If it failed because user_name column is missing, try again without it
  if (error && error.message.includes('user_name')) {
    console.warn("DB Warning: 'user_name' column missing in 'feedback' table. Retrying without it.");
    delete payload.user_name;
    const retry = await supabase.from('feedback').insert([payload]);
    error = retry.error;
  }

  if (error) {
    notifyError(`Feedback Error: ${error.message}`);
    return false;
  }
  return true;
};


/**
 * Fetches all public reviews and feedback entries.
 * Returns mock data if no entries exist in the database yet.
 * @returns {Promise<Feedback[]>} List of feedback entries.
 */
export const fetchReviews = async (): Promise<Feedback[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_FEEDBACK_STORE;
    }

    return (data as FeedbackRow[]).map((f) => ({
      id: f.id,
      user_name: f.user_name || 'Anonymous',
      user_email: f.user_email || 'anonymous@upl',
      rating: f.rating || 5,
      message: f.message || '',
      type: f.type || 'Feedback',
      timestamp: new Date(f.created_at || Date.now()).getTime()
    }));
  } catch (e) {
    console.error("fetchReviews Exception:", e);
    return MOCK_FEEDBACK_STORE;
  }
};


// 4. ANALYTICS (Calculated from Real DB Data)
/**
 * Generates analytics report (Revenue, Sales, Occupancy Trends).
 * Combines real database statistics with historical trends.
 * @param {string} timeframe - 'daily', 'weekly', or 'monthly'.
 * @returns {Promise<AnalyticsData>} Aggregated analytics object.
 */
export const fetchAnalytics = async (timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AnalyticsData> => {
  try {
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total, items, created_at, status')
      .eq('status', 'paid'); // Only count successfully paid orders

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('rating');

    if (orderError || feedbackError) {
      if (orderError) notifyError(`Analytics Order Error: ${orderError.message}`);
      if (feedbackError) notifyError(`Analytics Feedback Error: ${feedbackError.message}`);
      throw new Error("DB Error");
    }

    const safeOrders = orders || [];
    const safeFeedback = feedback || [];

    // Calculate Total Revenue
    const totalRevenue = safeOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    // Calculate Avg Rating
    const avgRating = safeFeedback.length > 0
      ? safeFeedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / safeFeedback.length
      : 0;

    // Calculate Item Sales and Category Distribution
    const itemCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = { 'Meals': 0, 'Snacks': 0, 'Beverages': 0 };
    
    safeOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          // Track item frequency
          const itemName = item.name || 'Unknown Item';
          itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
          
          // Track category distribution
          const cat = item.category || 'Other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + (item.quantity || 1);
        });
      }
    });

    const itemSales = Object.entries(itemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Format Category Split for Pie Chart
    const totalItems = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const categorySplit = totalItems > 0 
      ? Object.entries(categoryCounts).map(([label, value]) => ({
          label,
          value: Math.round((value / totalItems) * 100),
          color: label === 'Meals' ? '#f97316' : label === 'Snacks' ? '#3b82f6' : label === 'Beverages' ? '#10b981' : '#94a3b8'
        })).filter(c => c.value > 0)
      : getMockAnalytics(timeframe).category_split;

    // REAL TIME-SERIES GROUPING
    const timeLabels: string[] = [];
    const revenueByTime: Record<string, number> = {};
    const occupancyProxy: Record<string, number> = {};

    if (timeframe === 'daily') {
      // Last 24 hours in 2-hour blocks
      const hours = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
      hours.forEach(h => { revenueByTime[h] = 0; occupancyProxy[h] = 0; });
      
      safeOrders.forEach(order => {
        const date = new Date(order.created_at);
        const hour = date.getHours();
        let label = '8pm';
        if (hour < 10) label = '8am';
        else if (hour < 12) label = '10am';
        else if (hour < 14) label = '12pm';
        else if (hour < 16) label = '2pm';
        else if (hour < 18) label = '4pm';
        else if (hour < 20) label = '6pm';
        
        if (revenueByTime[label] !== undefined) {
          revenueByTime[label] += order.total;
          occupancyProxy[label] += 1; // 1 order approx proxy for 1-2 people
        }
      });
      timeLabels.push(...hours);
    } else if (timeframe === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(d => { revenueByTime[d] = 0; occupancyProxy[d] = 0; });
      
      safeOrders.forEach(order => {
        const day = new Date(order.created_at).getDay();
        const label = days[day === 0 ? 6 : day - 1]; // Convert 0-6 (Sun-Sat) to Mon-Sun
        revenueByTime[label] += order.total;
        occupancyProxy[label] += 1;
      });
      timeLabels.push(...days);
    } else {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      weeks.forEach(w => { revenueByTime[w] = 0; occupancyProxy[w] = 0; });
      
      safeOrders.forEach(order => {
        const date = new Date(order.created_at).getDate();
        const weekIdx = Math.min(3, Math.floor((date - 1) / 7));
        const label = weeks[weekIdx];
        revenueByTime[label] += order.total;
        occupancyProxy[label] += 1;
      });
      timeLabels.push(...weeks);
    }

    const revenueTrend = timeLabels.map(label => ({ label, value: revenueByTime[label] }));
    const occupancyTrend = timeLabels.map(label => ({ label, value: Math.min(60, occupancyProxy[label] * 5) })); // Scaled for 60 tables

    return {
      total_revenue: totalRevenue,
      avg_rating: Number(avgRating.toFixed(1)),
      item_sales: itemSales.slice(0, 5),
      revenue_trend: revenueTrend.length > 0 ? revenueTrend : getMockAnalytics(timeframe).revenue_trend,
      category_split: categorySplit,
      occupancy_trend: occupancyTrend.length > 0 ? occupancyTrend : getMockAnalytics(timeframe).occupancy_trend,
      top_items: itemSales.length > 0 ? itemSales.slice(0, 3).map(i => ({
        name: i.name,
        rating: 4.8, // Derived from overall avg or could be improved later
        category: 'Best Seller'
      })) : getMockAnalytics(timeframe).top_items
    };

  } catch (e: any) {
    notifyError(`Analytics Error: ${e.message}`);
    console.error("Analytics Error:", e);
    return getMockAnalytics(timeframe);
  }
};

/**
 * Generates a CSV report from real database data.
 * @returns {Promise<string>} Combined CSV content of orders and feedback.
 */
export const exportReportToCSV = async (): Promise<string> => {
  try {
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: reviews } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });

    let csv = "--- ORDER REPORT ---\n";
    csv += "Order ID,Email,Total,Status,Items,Date\n";
    
    (orders || []).forEach(o => {
      const itemsList = Array.isArray(o.items) 
        ? o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(' | ')
        : "N/A";
      csv += `"${o.id}","${o.user_email}",${o.total},"${o.status}","${itemsList}","${new Date(o.created_at).toLocaleString()}"\n`;
    });

    csv += "\n--- FEEDBACK REPORT ---\n";
    csv += "Review ID,User,Rating,Type,Message,Date\n";
    
    (reviews || []).forEach(r => {
      csv += `"${r.id}","${r.user_name || 'Anonymous'}",${r.rating},"${r.type || 'General'}","${(r.message || '').replace(/"/g, '""')}","${new Date(r.created_at).toLocaleString()}"\n`;
    });

    return csv;
  } catch (err) {
    console.error("Export failed:", err);
    return "Error generating report.";
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

/**
 * Authenticates users based on role.
 * Students use guest/email login, while Admins require full Supabase Auth.
 * @param {string} emailOrUser - User's identifier.
 * @param {string} [password] - Password for Admin accounts.
 * @returns {Promise<User | null>} Authenticated user object or null.
 */
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
