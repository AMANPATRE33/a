
import { MenuItem } from './types';

export const TOTAL_TABLES = 60;
export const TABLE_CAPACITY = 5;
export const API_BASE_URL = 'http://localhost:5000'; // Default, can be overridden by env
export const POLL_INTERVAL = 3000;

export const INITIAL_MENU: MenuItem[] = [
  // --- SNACKS ---
  { 
    id: '1', 
    name: 'Samosa (2pcs)', 
    price: 30, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '2', 
    name: 'Vada Pav', 
    price: 25, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1606411707253-15777df7ce89?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '3', 
    name: 'Veg Puff', 
    price: 20, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '4', 
    name: 'Bread Pakora', 
    price: 25, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1605333396915-476615772923?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '5', 
    name: 'Masala Fries', 
    price: 60, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1630384060421-a4323ce66ad8?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '6', 
    name: 'Paneer Roll', 
    price: 80, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '7', 
    name: 'Veg Sandwich', 
    price: 50, 
    category: 'Snacks', 
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' 
  },

  // --- MEALS ---
  { 
    id: '8', 
    name: 'Masala Dosa', 
    price: 70, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1589301760014-d929645603f8?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '9', 
    name: 'Idli Sambar (3pcs)', 
    price: 50, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1668236543090-d2f896911323?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '10', 
    name: 'Veg Thali Deluxe', 
    price: 120, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '11', 
    name: 'Chole Bhature', 
    price: 90, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '12', 
    name: 'Pav Bhaji', 
    price: 80, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '13', 
    name: 'Veg Biryani', 
    price: 110, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '14', 
    name: 'Hakka Noodles', 
    price: 90, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '15', 
    name: 'Aloo Paratha', 
    price: 60, 
    category: 'Meals', 
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80' 
  },

  // --- BEVERAGES ---
  { 
    id: '16', 
    name: 'Masala Chai', 
    price: 15, 
    category: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1619053386721-e054aeec686c?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '17', 
    name: 'Filter Coffee', 
    price: 20, 
    category: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1596952954288-29e2974eb366?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '18', 
    name: 'Sweet Lassi', 
    price: 50, 
    category: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '19', 
    name: 'Cold Coffee', 
    price: 60, 
    category: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80' 
  },
  { 
    id: '20', 
    name: 'Soft Drink (Cola)', 
    price: 40, 
    category: 'Beverages', 
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' 
  }
];
