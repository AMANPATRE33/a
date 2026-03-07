import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  ChefHat, 
  Camera, 
  CreditCard, 
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  X,
  FileText,
  Settings,
  TrendingUp,
  Store,
  LogOut,
  Lock,
  User as UserIcon,
  ArrowRight,
  List,
  PlusCircle,
  Moon,
  Sun,
  MessageSquare,
  Star,
  Send,
  History,
  Receipt as ReceiptIcon,
  BarChart3,
  Mail,
  Award,
  RefreshCw,
  Signal,
  VideoOff,
  Armchair,
  Search,
  Filter,
  AlertCircle,
  Bot,
  UtensilsCrossed,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Quote,
  DollarSign,
  ShoppingBag,
  ChevronRight,
  ChevronUp,
  Clock,
  Percent,
  ThumbsUp,
  Smile,
  Frown,
  Meh,
  ShoppingCart,
  Loader2,
  ShieldCheck,
  Flame,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  fetchStatus, 
  fetchTableStatus, 
  fetchCameraFeeds, 
  loginUser, 
  processPaymentMock, 
  createOrder, 
  fetchOrderHistory, 
  fetchAnalytics, 
  submitFeedbackData, 
  fetchMenu, 
  addMenuItemToDB, 
  deleteMenuItemFromDB, 
  registerGlobalErrorCallback, 
  fetchReviews 
} from './services/apiService';
import { 
  CafeteriaStatus, 
  TableStatus, 
  CrowdStatus, 
  MenuItem, 
  CartItem, 
  Receipt, 
  User, 
  AnalyticsData, 
  CameraFeed, 
  Feedback 
} from './types';
import { TOTAL_TABLES, TABLE_CAPACITY, POLL_INTERVAL } from './constants';

// --- Configuration for Custom Logo ---
const CUSTOM_LOGO_URL = ""; 

// --- Custom Logo Component ---
const SmartAnnaLogo = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl border-4 border-white dark:border-slate-800 ${className}`} style={{ width: '120px', height: '120px' }}>
    <img 
      src="/app_logo.jpg" 
      alt="Smart Anna Logo" 
      className="w-full h-full object-cover object-center transform scale-110 hover:scale-125 transition-transform duration-700"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";
      }}
    />
    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse"></div>
  </div>
);

// --- SKELETON LOADER COMPONENT ---
const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} style={style}></div>
);

// --- THEME TOGGLE COMPONENT ---
const ThemeToggle = ({ isDark, toggle }: { isDark: boolean, toggle: () => void }) => (
  <label className="switch scale-75 md:scale-90">
    <input id="input" type="checkbox" checked={isDark} onChange={toggle} />
    <div className="slider round">
      <div className="sun-moon">
        <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
        <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
        <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
        <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
        <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
        <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
      </div>
      <div className="stars">
        <svg id="star-1" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10 10 10 10 0 C 10 10 10 10 20 10 C 10 10 10 10 0 10 Z"></path></svg>
        <svg id="star-2" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10 10 10 10 0 C 10 10 10 10 20 10 C 10 10 10 10 0 10 Z"></path></svg>
        <svg id="star-3" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10 10 10 10 0 C 10 10 10 10 20 10 C 10 10 10 10 0 10 Z"></path></svg>
        <svg id="star-4" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10 10 10 10 0 C 10 10 10 10 20 10 C 10 10 10 10 0 10 Z"></path></svg>
      </div>
    </div>
  </label>
);

// --- SMOOTH TREND CHART (Occupancy) ---
const SmoothTrendChart = ({ data }: { data: { time: string, val: number }[] }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 200;
  const padding = 20;
  
  const maxValue = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((d.val / maxValue) * (height - 2 * padding)) - padding;
    return { x, y };
  });

  const pathData = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = pathData + ` L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="w-full h-full p-2 bg-[#1e293b] rounded-xl border border-slate-700/50 shadow-inner overflow-hidden relative">
      <div className="absolute top-2 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">Occupancy Trend (Live)</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((tick, i) => {
           const y = height - ((tick / 100) * (height - 2 * padding)) - padding;
           return (
             <g key={i}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 5} y={y + 3} textAnchor="end" className="text-[8px] fill-slate-500 font-mono">{tick}</text>
             </g>
           )
        })}
        {data.map((d, i) => {
           const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
           return (
             <g key={i}>
               <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
               <text x={x} y={height - 5} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold uppercase">{d.time}</text>
             </g>
           )
        })}
        <path d={areaPath} fill="url(#cyanGradient)" />
        <path d={pathData} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-[#0f172a] stroke-[#22d3ee] stroke-2 hover:r-6 transition-all cursor-crosshair" />
        ))}
      </svg>
    </div>
  );
};

// --- SIMPLE SVG CHARTS ---
const SimpleLineChart = ({ data }: { data: { label: string, value: number }[] }) => {
   if (!data || data.length === 0) return null;
   const width = 600;
   const height = 200;
   const padding = 20;
   const maxValue = Math.max(...data.map(d => d.value));
   
   const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - ((d.value / maxValue) * (height - 2 * padding)) - padding;
      return `${x},${y}`;
   }).join(' ');

   return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
         <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#f97316" stopOpacity="0.4"/>
               <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
            </linearGradient>
         </defs>
         {/* Grid lines - Increased contrast for light mode visibility */}
         <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#cbd5e1" strokeWidth="1" />
         <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" opacity="0.5" />
         <path d={`M ${points.split(' ')[0]} ${points} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#chartGradient)" />
         <polyline points={points} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
         {data.map((d, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((d.value / maxValue) * (height - 2 * padding)) - padding;
            return (
               <circle key={i} cx={x} cy={y} r="4" className="fill-white stroke-orange-500 stroke-2" />
            );
         })}
         {data.map((d, i) => {
             const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
             return <text key={i} x={x} y={height + 15} textAnchor="middle" className="text-xs fill-slate-400 font-medium">{d.label}</text>;
         })}
      </svg>
   );
};

const SimpleDoughnutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
        {data.map((slice, i) => {
          const startPercent = cumulativePercent;
          const slicePercent = slice.value / total;
          cumulativePercent += slicePercent;
          
          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return (
            <path key={i} d={pathData} fill={slice.color} className="stroke-white dark:stroke-slate-900 stroke-[0.05] hover:opacity-90 transition-opacity" />
          );
        })}
        <circle cx="0" cy="0" r="0.6" className="fill-white dark:fill-slate-900" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs font-medium text-slate-400">TOTAL</span>
        <span className="text-xl font-black text-slate-900 dark:text-white">{total}%</span>
      </div>
    </div>
  );
}

// --- NEW: BAR CHART FOR OCCUPANCY ---
const SimpleBarChart = ({ data }: { data: { label: string, value: number }[] }) => {
   if (!data || data.length === 0) return null;
   const width = 600;
   const height = 200;
   const padding = 30;
   const maxValue = Math.max(...data.map(d => d.value));
   const barWidth = (width - 2 * padding) / data.length * 0.6; // 60% of available slot width

   return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
         {/* Grid lines - Increased contrast */}
         <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
         
         {data.map((d, i) => {
            const slotWidth = (width - 2 * padding) / data.length;
            const x = padding + (i * slotWidth) + (slotWidth - barWidth) / 2;
            const barHeight = (d.value / maxValue) * (height - 2 * padding);
            const y = height - padding - barHeight;
            
            return (
               <g key={i}>
                  <rect 
                     x={x} 
                     y={y} 
                     width={barWidth} 
                     height={barHeight} 
                     className="fill-blue-500 dark:fill-blue-600 hover:opacity-80 transition-opacity" 
                     rx="4"
                  />
                  <text 
                     x={x + barWidth / 2} 
                     y={height - 5} 
                     textAnchor="middle" 
                     className="text-xs fill-slate-400 font-medium"
                  >
                     {d.label}
                  </text>
                  <text 
                     x={x + barWidth / 2} 
                     y={y - 5} 
                     textAnchor="middle" 
                     className="text-[10px] fill-slate-500 dark:fill-slate-400 font-bold"
                  >
                     {d.value}
                  </text>
               </g>
            );
         })}
      </svg>
   );
};

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [loginMode, setLoginMode] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- App States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ordering' | 'visuals' | 'admin' | 'feedback' | 'analytics'>('dashboard');
  const [liveStatus, setLiveStatus] = useState<CafeteriaStatus>({ people_inside: 0, status: CrowdStatus.FREE });
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null);
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<Receipt | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // NEW: Confirmation state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [receiptTimer, setReceiptTimer] = useState(120);
  const [notification, setNotification] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Receipt[]>([]);
  
  // NEW: Mobile Cart Modal State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Real-time Clock for Camera Feeds
  const [camTimestamp, setCamTimestamp] = useState(new Date());

  // Ordering & Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Theme State - CHANGED: Default isDark to true
  const [isDark, setIsDark] = useState(true);

  // Feedback State
  const FEEDBACK_CATEGORIES = ['Food Quality', 'Cleanliness', 'Seating', 'Staff Behavior', 'Ambiance', 'Overall'];
  const [feedbackForm, setFeedbackForm] = useState({ type: 'Food Quality', message: '', rating: 5 });
  const [reviews, setReviews] = useState<Feedback[]>([]);

  // Admin States
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Snacks' as any });

  // --- Recommendation State ---
  const [recommendation, setRecommendation] = useState<MenuItem | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Password visibility toggle

  // --- Theme Effect ---
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // --- Recommendation Effect (Mobile Only) ---
  useEffect(() => {
    if (user && window.innerWidth < 768) {
       const loadRecommendation = async () => {
          // Small delay to not overwhelm user immediately on login
          await new Promise(r => setTimeout(r, 1500));
          
          const items = await fetchMenu();
          if (items.length > 0) {
             // Logic to pick "Today's Best": 
             // 1. Try to find a "Special" or high-value item (simulated by name)
             // 2. Fallback to random item
             const bestItem = items.find(i => i.name.includes('Biryani') || i.name.includes('Thali')) || items[Math.floor(Math.random() * items.length)];
             
             setRecommendation(bestItem);
             setShowRecommendation(true);
          }
       };
       loadRecommendation();
    }
  }, [user]);

  // --- Clock Effect ---
  useEffect(() => {
    const timer = setInterval(() => setCamTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Helper: Notifications (Stable Callback) ---
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // --- Data Fetching ---
  const refreshMenu = useCallback(async () => {
    const items = await fetchMenu();
    setMenu(items);
  }, []);

  const updateDashboard = useCallback(async () => {
    if (!user || appLoading) return;
    try {
      const status = await fetchStatus();
      setLiveStatus(status);
      const tStatus = await fetchTableStatus(status.people_inside);
      setTableStatus(tStatus);
    } catch (e) {
      console.warn("Update failed", e);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [user, appLoading]);

  const loadReviews = useCallback(async () => {
    const data = await fetchReviews();
    setReviews(data);
  }, []);

  const loadCameras = useCallback(async () => {
     if(user) {
        setCamerasLoading(true);
        const feeds = await fetchCameraFeeds();
        if (feeds.length > 0) {
           setTimeout(() => {
             setCameraFeeds(feeds);
             setCamerasLoading(false);
           }, 800);
        } else {
           setCameraFeeds([]);
           setCamerasLoading(false);
        }
     }
  }, [user]);

  // --- Register Global Error Handler & Initial Load ---
  useEffect(() => {
    registerGlobalErrorCallback(showNotification);
    refreshMenu(); // Initial load
    return () => registerGlobalErrorCallback(() => console.warn("Error handler unmounted"));
  }, [showNotification, refreshMenu]);
  useEffect(() => {
    if (user && !appLoading) {
       updateDashboard();
       const interval = setInterval(updateDashboard, POLL_INTERVAL);
       return () => clearInterval(interval);
    }
  }, [updateDashboard, user, appLoading]);



  useEffect(() => {
    if (activeTab === 'visuals') loadCameras();
    if (activeTab === 'ordering' || activeTab === 'admin') refreshMenu();
    if (activeTab === 'feedback') loadReviews();
  }, [loadCameras, refreshMenu, loadReviews, activeTab]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && activeTab === 'analytics') {
      setAnalyticsData(null); 
      fetchAnalytics(analyticsTimeframe).then(setAnalyticsData);
      loadReviews(); 
    }
  }, [user, activeTab, analyticsTimeframe, loadReviews]);

  const handleFetchHistory = async () => {
    if (user) {
      const history = await fetchOrderHistory(user.email);
      setOrderHistory(history);
      setShowHistory(true);
    }
  };

  useEffect(() => {
    let interval: any;
    if (showReceipt) {
      setReceiptTimer(120);
      interval = setInterval(() => {
        setReceiptTimer((prev) => {
          if (prev <= 1) {
            setShowReceipt(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showReceipt]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setLoginError(null);
    
    if (loginMode === 'STUDENT') {
      if (!loginEmail.toLowerCase().includes('@upl')) {
         setLoginError("Access Denied: Please use a valid student email ending in @upl (e.g., rahul@upl)");
         setAuthLoading(false);
         return;
      }
    }

    const authedUser = await loginUser(loginEmail, loginMode === 'ADMIN' ? loginPass : undefined);
    setAuthLoading(false); 
    
    if (authedUser) {
      setUser(authedUser);
      setLoginEmail('');
      setLoginPass('');
      setActiveTab('dashboard');
      refreshMenu(); // Pre-fetch menu for all roles
    } else {
      setLoginError("Authentication Failed: Invalid username or password.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setShowReceipt(null);
    setNotification(null);
    setIsMobileCartOpen(false);
    setIsDashboardLoading(true);
  };

  const estimatedOccupied = Math.ceil(liveStatus.people_inside / TABLE_CAPACITY);
  const displayOccupied = tableStatus?.occupied_tables ?? estimatedOccupied;
  const displayEmpty = TOTAL_TABLES - displayOccupied;
  const occupancyPercentage = Math.round((displayOccupied / TOTAL_TABLES) * 100);

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category,
      image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60`
    };

    const updatedMenu = [...menu, item];
    setMenu(updatedMenu);
    
    setNewItem({ name: '', price: '', category: 'Snacks' });
    showNotification(`Adding "${item.name}"...`);

    const success = await addMenuItemToDB(item);
    if (!success) {
      // If failed, maybe revert or show error (currently logic was inverted in original code?)
      // Original: if (!success) refreshMenu() else notification
      // We want to refresh on success to get IDs
      refreshMenu(); 
    } else {
      showNotification(`"${item.name}" added successfully.`);
      refreshMenu(); // Refresh to get the DB ID
    }
  };

  const handleRemoveMenuItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the database?`)) {
      const updatedMenu = menu.filter(item => item.id !== id);
      setMenu(updatedMenu);
      
      const success = await deleteMenuItemFromDB(id);
      if (success) {
        showNotification(`"${name}" has been removed.`);
      } else {
        refreshMenu();
      }
    }
  };

  const filteredMenu = useMemo(() => {
    let result = menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [menu, selectedCategory, searchQuery, sortBy]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feedbackPayload = {
      user_name: user?.name || "Anonymous",
      user_email: user?.email || "anonymous@upl",
      type: feedbackForm.type as any,
      rating: feedbackForm.rating,
      message: feedbackForm.message,
    };
    
    await submitFeedbackData(feedbackPayload);
    showNotification("Thank you! Your feedback has been recorded.");
    setFeedbackForm({ type: 'Food Quality', message: '', rating: 5 });
    loadReviews(); 
  };

  const getTodayReviews = () => {
     const today = new Date().setHours(0,0,0,0);
     return reviews.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
  };
  
  const getTopReviews = () => {
    return [...getTodayReviews()].sort((a, b) => b.rating - a.rating).slice(0, 3);
  };
  
  const getRecentReviews = () => {
     return [...reviews].sort((a,b) => b.timestamp - a.timestamp);
  };

  const getAdminReviews = () => {
    return reviews.slice(0, 5);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    // Added direct notification here if called from quick add button
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
       const newCart = prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0);
       if (newCart.length === 0) setIsMobileCartOpen(false);
       return newCart;
    });
  };

  const handlePayment = async (method: string) => {
    if (cart.length === 0 || !user) return;
    setIsProcessingPayment(true);
    
    const totalAmount = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const success = await processPaymentMock(totalAmount, method);
    
    if (success) {
      const receiptId = `RC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        id: receiptId,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        items: [...cart],
        total: totalAmount,
        timestamp: Date.now(),
        paymentMethod: method
      };

      const dbSaved = await createOrder({
        ...newOrder,
        user_name: user.name,
        user_email: user.email
      });

      if (dbSaved) {
        setShowReceipt(newOrder);
        setCart([]);
        setIsMobileCartOpen(false);
        showNotification("Order placed successfully!");
      } else {
         // Even if DB fails, show receipt (offline fallback)
         setShowReceipt(newOrder);
         setCart([]);
         setIsMobileCartOpen(false);
      }
    } else {
      alert("Payment Failed. Please try again.");
    }
    setIsProcessingPayment(false);
  };

  const StatusCard = ({ title, value, icon: Icon, color, subLabel, loading }: { title: string, value?: string | number, icon: any, color: string, subLabel?: React.ReactNode, loading?: boolean }) => (
    <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md active:scale-95 transform duration-300 flex flex-col justify-between min-h-[110px] md:min-h-[140px]">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 md:p-2 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate ml-2">{title}</span>
      </div>
      <div>
         {loading ? (
            <Skeleton className="h-6 md:h-8 w-16 md:w-24 mb-2" />
         ) : (
            <div className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 truncate">{value}</div>
         )}
         {loading ? <Skeleton className="h-3 md:h-4 w-12 md:w-16" /> : subLabel && <div className="mt-1 md:mt-2 scale-90 origin-left md:scale-100">{subLabel}</div>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfdfe] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex-col gap-10 relative z-40">
        <div className="flex items-center gap-3">
          <SmartAnnaLogo />
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 dark:text-white truncate">SMART ANNA</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate max-w-[150px]">{user?.email || 'Guest'}</p>
          </div>
        </div>

        {user && (
          <nav className="flex flex-col gap-2">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={CreditCard} label="Order Food" active={activeTab === 'ordering'} onClick={() => setActiveTab('ordering')} />
            <NavItem icon={MessageSquare} label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
            <NavItem icon={Camera} label="Live Feeds" active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} />
            
            {user.role === 'ADMIN' && (
              <>
                <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-2">Admin</p>
                <NavItem icon={BarChart3} label="Revenue" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                <NavItem icon={Settings} label="Manage Menu" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
              </>
            )}
          </nav>
        )}

        <div className="mt-auto space-y-4">
           {/* Theme Toggle in Sidebar */}
           <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
           </div>

          {user && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* --- MOBILE HEADER & MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
         {/* MOBILE HEADER */}
         <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-5 py-4 flex justify-between items-center transition-all shadow-sm shadow-slate-200/50 dark:shadow-black/20">
            <div className="flex items-center gap-3">
               <SmartAnnaLogo className="scale-75 origin-left" />
               <div>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Smart Anna</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cafeteria AI</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
               {user && <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={18} /></button>}
            </div>
         </header>

         {/* MAIN CONTENT */}
         {!user ? (
           // --- LOGIN VIEW ---
            <div className="flex-1 flex items-center justify-center p-4 md:p-6 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-50">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200 dark:bg-orange-900/20 rounded-full blur-[100px]"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 dark:bg-blue-900/20 rounded-full blur-[100px]"></div>
              </div>

              <div className="auth-card-outer max-w-md w-full relative z-10">
                <div className="auth-card-inner bg-white dark:bg-slate-900 p-8 md:p-12">
                  <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-30 animate-pulse"></div>
                      <SmartAnnaLogo className="relative z-10" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white text-center tracking-tighter">Smart Anna</h1>
                    <p className="text-sm font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.4em] mt-4">Intelligence at your service</p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-center mt-4 text-base italic">
                      "Swift. Smart. Satisfying."
                    </p>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 border border-slate-200 dark:border-slate-700">
                    <button 
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${loginMode === 'STUDENT' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      onClick={() => { setLoginMode('STUDENT'); setLoginEmail(''); setLoginPass(''); setLoginError(null); }}
                    >
                      Student
                    </button>
                    <button 
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${loginMode === 'ADMIN' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      onClick={() => { setLoginMode('ADMIN'); setLoginEmail(''); setLoginPass(''); setLoginError(null); }}
                    >
                      Admin
                    </button>
                  </div>

                  {loginError && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-4 flex gap-3 items-start animate-shake relative">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <div className="flex-1 pr-6">
                        <h4 className="text-red-700 dark:text-red-400 font-black text-xs uppercase mb-1">Authentication Error</h4>
                        <p className="text-xs font-medium text-red-600 dark:text-red-300 leading-relaxed">{loginError}</p>
                      </div>
                      <button 
                        onClick={() => setLoginError(null)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-1 block">
                        {loginMode === 'STUDENT' ? 'College ID (name@upl)' : 'Admin Username'}
                      </label>
                      <div className="relative group">
                        {loginMode === 'STUDENT' ? (
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                        ) : (
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                        )}
                        <input 
                          type={loginMode === 'STUDENT' ? 'text' : 'text'}
                          required
                          value={loginEmail}
                          onChange={e => { setLoginEmail(e.target.value); setLoginError(null); }}
                          className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 rounded-2xl px-12 py-4 font-bold text-slate-800 dark:text-slate-200 focus:outline-none transition-all duration-300 ${loginError ? 'border-red-400 dark:border-red-500 focus:border-red-600' : 'border-slate-400 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800'}`}
                          placeholder={loginMode === 'STUDENT' ? "rahul@upl" : "Enter username"}
                        />
                      </div>
                    </div>

                    {loginMode === 'ADMIN' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Secret Access Key</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={loginPass}
                            onChange={e => { setLoginPass(e.target.value); setLoginError(null); }}
                            className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 rounded-2xl px-12 py-4 font-bold text-slate-800 dark:text-slate-200 focus:outline-none transition-all duration-300 ${loginError ? 'border-red-400 dark:border-red-500 focus:border-red-600' : 'border-slate-400 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800'}`}
                            placeholder="••••••••"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full bg-slate-900 dark:bg-orange-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-slate-800 dark:hover:bg-orange-700 transition-all flex items-center justify-center gap-2 mt-6 shadow-xl shadow-slate-300 dark:shadow-none transform active:scale-95 min-h-[64px]"
                    >
                      {authLoading ? (
                        <span>Processing...</span>
                      ) : (
                        <>Access Portal <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                  
                  <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-loose">
                      {loginMode === 'ADMIN' ? 'Secure Admin Entrance' : 'Authenticated Access Only'}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase mt-4 tracking-widest">
                       © 2024 • Rights Reserved to UPL University
                    </p>
                  </div>
                </div>
              </div>
            </div>
         ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-32 md:pb-8 scroll-smooth">
              {/* ... (Dashboard, Visuals, Feedback content kept same) ... */}
              {activeTab === 'dashboard' && (
               <div className="max-w-6xl mx-auto space-y-6 md:space-y-10">
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                     <span className="text-orange-600 font-bold text-xs uppercase tracking-widest">Real-time Analytics</span>
                     <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mt-1">Live Canteen Status</h2>
                  </div>
                  <div className="clock-card shadow-xl shadow-slate-300 dark:shadow-none transform scale-90 origin-left md:scale-100 hidden xs:flex">
                     {/* Clock Card Content */}
                     {camTimestamp.getHours() >= 6 && camTimestamp.getHours() < 18 ? <Sun className="moon text-yellow-400" /> : <Moon className="moon text-white" />}
                     <span className="time-text">
                        {camTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                        <span className="time-sub-text">{camTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[1]}</span>
                     </span>
                     <span className="day-text">{camTimestamp.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  </header>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                     <StatusCard title="Inside" value={liveStatus.people_inside} icon={Users} color="bg-blue-600 text-blue-600" loading={isDashboardLoading} />
                     <StatusCard title="Density" value={liveStatus.status} icon={PieChart} color={liveStatus.status === 'CROWDED' ? 'bg-red-500 text-red-500' : 'bg-green-500 text-green-500'} loading={isDashboardLoading} />
                     <StatusCard title="Free Tables" value={displayEmpty} icon={CheckCircle2} color="bg-emerald-500 text-emerald-500" loading={isDashboardLoading} subLabel={
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${tableStatus?.is_actual ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                           {tableStatus?.is_actual ? <Wifi size={10} /> : <AlertCircle size={10} />}
                           {tableStatus?.is_actual ? 'Live' : 'AI Est'}
                        </div>
                     } />
                     <StatusCard title="Advice" value={liveStatus.status === 'CROWDED' ? 'WAIT' : 'GO NOW'} icon={TrendingUp} color="bg-slate-800 text-slate-800 dark:bg-slate-200 dark:text-slate-200" loading={isDashboardLoading} />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                     <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                           <h3 className="text-lg md:text-xl font-black dark:text-white">Floor Map ({TOTAL_TABLES})</h3>
                           <div className="flex gap-4">
                              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full</span></div>
                              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Partial</span></div>
                              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Free</span></div>
                           </div>
                        </div>
                        {isDashboardLoading ? (
                           <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 md:gap-3">
                              {Array.from({ length: TOTAL_TABLES }).map((_, i) => (
                                 <Skeleton key={i} className="aspect-square rounded-lg" />
                              ))}
                           </div>
                        ) : (
                           <div className="md:max-h-none overflow-y-auto custom-scrollbar pr-2 md:pr-0">
                             <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 md:gap-3">
                                {Array.from({ length: TOTAL_TABLES }).map((_, i) => {
                                   const capacity = TABLE_CAPACITY;
                                   const totalPeople = liveStatus.people_inside;
                                   const fullTablesCount = Math.floor(totalPeople / capacity);
                                   const peopleInPartialTable = totalPeople % capacity;
                                   
                                   let status = 'FREE';
                                   let peopleHere = 0;
                                   
                                   if (i < fullTablesCount) {
                                       status = 'FULL';
                                       peopleHere = capacity;
                                   } else if (i === fullTablesCount && peopleInPartialTable > 0) {
                                       status = 'PARTIAL';
                                       peopleHere = peopleInPartialTable;
                                   } else {
                                       status = 'FREE';
                                       peopleHere = 0;
                                   }
  
                                   let cardClass = "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
                                   let dotFilledClass = "bg-green-500";
                                   let dotEmptyClass = "bg-green-200 dark:bg-green-900/40";
                                   
                                   if (status === 'FULL') {
                                      cardClass = "bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
                                      dotFilledClass = "bg-red-500";
                                      dotEmptyClass = "bg-red-200";
                                   } else if (status === 'PARTIAL') {
                                      cardClass = "bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400";
                                      dotFilledClass = "bg-orange-500";
                                      dotEmptyClass = "bg-orange-200 dark:bg-orange-900/40";
                                   }
  
                                   return (
                                      <div key={i} className={`flex flex-col items-center justify-between p-2 rounded-xl border aspect-square transition-all duration-300 ${cardClass}`}>
                                         <UtensilsCrossed size={16} strokeWidth={2.5} className="mt-1 opacity-80" />
                                         <span className="text-[10px] md:text-xs font-black uppercase tracking-tight">
                                            T-{i+1}
                                         </span>
                                         <div className="flex gap-[2px]">
                                            {Array.from({length: 5}).map((_, dotIdx) => (
                                                <div 
                                                    key={dotIdx} 
                                                    className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${dotIdx < peopleHere ? dotFilledClass : dotEmptyClass}`}
                                                ></div>
                                            ))}
                                         </div>
                                      </div>
                                   );
                                })}
                             </div>
                           </div>
                        )}
                     </div>
                     
                     <div className="h-64 lg:h-auto w-full">
                        {isDashboardLoading ? (
                           <Skeleton className="w-full h-full rounded-3xl" />
                        ) : (
                           <SmoothTrendChart data={[
                             { time: '10:00', val: 12 },
                             { time: '10:15', val: 25 },
                             { time: '10:30', val: 45 },
                             { time: '10:45', val: 30 },
                             { time: '11:00', val: 42 }
                           ]} />
                        )}
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-blue-500 dark:text-blue-400">
                        <Wifi size={120} />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className={`p-3 rounded-2xl ${tableStatus?.is_actual ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                              {tableStatus?.is_actual ? <Wifi size={24} /> : <WifiOff size={24} />}
                           </div>
                           <div>
                              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">Real-Time Sensor Data</h3>
                              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                 SOURCE: {tableStatus?.is_actual ? 'IOT SENSORS (/api/tables)' : 'AI CROWD ESTIMATION'}
                              </p>
                           </div>
                        </div>
                        
                        {isDashboardLoading ? (
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                              <Skeleton className="h-24 w-full rounded-2xl" />
                              <Skeleton className="h-24 w-full rounded-2xl" />
                              <Skeleton className="h-24 w-full rounded-2xl" />
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                              <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Capacity</div>
                                 <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{TOTAL_TABLES} <span className="text-sm font-bold text-slate-400">Tables</span></div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Occupancy Rate</span>
                                    <span>{occupancyPercentage}%</span>
                                 </div>
                                 <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1 mb-2">
                                    <div className={`h-full ${occupancyPercentage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${occupancyPercentage}%` }}></div>
                                 </div>
                                 <div className="text-sm font-bold text-slate-500">{displayOccupied} / {TOTAL_TABLES} Occupied</div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Actually Available</div>
                                  <div className="text-2xl md:text-3xl font-black text-emerald-500">{displayEmpty} <span className="text-sm font-bold text-slate-400">Tables</span></div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
            
            {activeTab === 'ordering' && (
               <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-6 md:gap-10">
                  {showHistory ? (
                     <div className="flex-1 space-y-6">
                        <header className="flex items-center justify-between">
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white">History</h2>
                           <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">Back</button>
                        </header>
                        <div className="space-y-4">
                           {orderHistory.length === 0 ? (
                              <div className="text-center py-20 opacity-50">
                                 <History size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600"/>
                                 <p className="font-bold text-slate-400">No past orders found.</p>
                              </div>
                           ) : (
                              orderHistory.map(order => (
                                 <div key={order.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
                                             <ReceiptIcon size={24} />
                                          </div>
                                          <div>
                                             <h3 className="font-black text-lg text-slate-900 dark:text-white">Order #{order.id}</h3>
                                             <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> {new Date(order.timestamp).toLocaleString()}
                                             </div>
                                          </div>
                                       </div>
                                       <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5">
                                          <CheckCircle2 size={12} /> Paid
                                       </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 space-y-2">
                                       {order.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                             <span className="font-medium text-slate-600 dark:text-slate-300">
                                                <span className="font-black text-slate-900 dark:text-white mr-2">{item.quantity}x</span> 
                                                {item.name}
                                             </span>
                                             <span className="text-slate-400">₹{item.price * item.quantity}</span>
                                          </div>
                                       ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                          Via {order.paymentMethod || 'UPI'}
                                       </div>
                                       <div className="text-xl font-black text-slate-900 dark:text-white">
                                          ₹{order.total}
                                       </div>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 space-y-6">
                        <header className="space-y-4">
                           <div className="flex justify-between items-center">
                              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Menu</h2>
                              <button onClick={handleFetchHistory} className="p-2 md:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500"><History size={20}/></button>
                           </div>
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" placeholder="Search food..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-orange-500 dark:text-white" />
                           </div>
                           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {['All', 'Snacks', 'Meals', 'Beverages'].map(cat => (
                                 <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}>{cat}</button>
                              ))}
                           </div>
                        </header>

                        {/* DEBUG INFO FOR USER */}
                        {menu.length === 0 && (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                             <p className="text-slate-500 dark:text-slate-400 font-bold">
                               Menu State: {menu.length} items loaded from DB.
                             </p>
                             <p className="text-xs text-slate-400 mt-2">
                                If you have data in Supabase, please check your RLS policies or console logs (F12).
                             </p>
                          </div>
                        )}

                        {/* NEW 3D FLIP CARD GRID - UPDATED RESPONSIVENESS AND PERSISTENT ADD BUTTON */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-14 justify-items-center pb-8">
                           {filteredMenu.map(item => (
                              <div key={item.id} className="relative w-full max-w-[220px]">
                                <div className="flip-card group cursor-pointer">
                                  <div className="flip-content">
                                    <div className="flip-front">
                                      <div className="front-content">
                                        <div className="badge">{item.category}</div>
                                        <div className="description">
                                          <div className="title">
                                            <p className="truncate mr-2">{item.name}</p>
                                            <p className="text-orange-400">₹{item.price}</p>
                                          </div>
                                          <p className="card-footer">
                                            Details &rarr;
                                          </p>
                                        </div>
                                      </div>
                                      <img src={item.image} alt={item.name} className="img" />
                                    </div>
                                    <div className="flip-back">
                                      <div className="flip-back-content">
                                        <div className="circle">
                                          <div id="bottom"></div>
                                          <div id="right"></div>
                                        </div>
                                        <div className="text-center z-20">
                                          <h4 className="font-black text-lg mb-1">{item.name}</h4>
                                          <p className="text-sm font-bold text-orange-400 mb-4">₹{item.price}</p>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              addToCart(item);
                                              showNotification(`${item.name} added!`);
                                            }} 
                                            className="bg-white text-orange-600 px-6 py-2 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-transform shadow-lg"
                                          >
                                            ADD TO CART
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* PERSISTENT ADD BUTTON (Visible without Flip) */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                    showNotification(`${item.name} added!`);
                                  }}
                                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-6 py-2.5 rounded-full font-black text-xs shadow-xl hover:bg-orange-700 active:scale-95 transition-all z-20 flex items-center gap-2 border-4 border-slate-50 dark:border-slate-950 whitespace-nowrap"
                                >
                                  <Plus size={14} strokeWidth={4} /> ADD
                                </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                  
                  {/* DESKTOP CART SIDEBAR (Hidden on mobile) */}
                  <div className="hidden xl:block w-96 shrink-0">
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-10">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">Cart <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-2 py-0.5 rounded-full">{cart.reduce((a,b) => a+b.quantity, 0)}</span></h3>
                        {cart.length === 0 ? <div className="py-20 text-center opacity-40"><Store size={48} className="mx-auto mb-2"/><p className="font-bold text-sm">Empty Cart</p></div> : 
                           <div className="space-y-6">
                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                 {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3">
                                       <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                                       <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate dark:text-slate-200">{item.name}</div><div className="text-xs text-slate-400">₹{item.price}</div></div>
                                       <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-700"><button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={12}/></button><span className="text-xs font-black w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={12}/></button></div>
                                    </div>
                                 ))}
                              </div>
                              <div className="border-t border-slate-100 dark:border-slate-800 pt-4"><div className="flex justify-between text-xl font-black dark:text-white"><span>Total</span><span>₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span></div></div>
                              <button onClick={() => setShowConfirmation(true)} disabled={isProcessingPayment} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all">Pay with UPI</button>
                           </div>
                        }
                     </div>
                  </div>
               </div>
            )}

            {/* ... (Visuals, Feedback, Admin, Mobile Nav, Modals kept same) ... */}
            {activeTab === 'visuals' && (
              <div className="max-w-7xl mx-auto space-y-6">
                  <header className="flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Live Feeds</h2>
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 animate-pulse">UNDER DEVELOPMENT</span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500">Real-time CCTV coverage powered by AI.</p>
                    </div>
                    <button onClick={loadCameras} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500">
                      <RefreshCw size={20} className={camerasLoading ? 'animate-spin' : ''} />
                    </button>
                  </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {camerasLoading ? Array.from({length: 4}).map((_, i) => <div key={i} className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>) : cameraFeeds.map((feed) => (
                       <div key={feed.id} className="relative rounded-3xl overflow-hidden aspect-video bg-black group">
                          <img src={feed.url} className={`w-full h-full object-cover ${feed.status !== 'ONLINE' ? 'grayscale opacity-50' : ''}`} alt={feed.name} />
                          <div className="absolute top-4 left-4 flex gap-2"><div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase backdrop-blur-md ${feed.status === 'ONLINE' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>{feed.status === 'ONLINE' ? 'LIVE' : 'OFFLINE'}</div></div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"><div className="text-white font-bold text-sm md:text-lg">{feed.name}</div><div className="text-white/70 text-xs">{feed.location}</div></div>
                       </div>
                    ))}
                    {user.role === 'ADMIN' && !camerasLoading && (
                       <button className="rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-900 transition-all group aspect-video bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 flex items-center justify-center mb-4 transition-colors"><Plus size={24} className="md:w-8 md:h-8" /></div>
                          <span className="font-bold text-sm">Connect New Feed</span>
                       </button>
                    )}
                 </div>
              </div>
            )}
            
            {activeTab === 'feedback' && (
               <div className="max-w-6xl mx-auto space-y-10">
                  <header>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white">Community Buzz</h2>
                      <p className="text-slate-500 font-medium">Your voice shapes our cafeteria.</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                          <form onSubmit={handleFeedbackSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm sticky top-6">
                            <div>
                                <h3 className="text-lg font-black dark:text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="text-orange-500" size={20}/> Share Experience
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {FEEDBACK_CATEGORIES.map(cat => (
                                        <button 
                                            key={cat}
                                            type="button"
                                            onClick={() => setFeedbackForm({...feedbackForm, type: cat})}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${feedbackForm.type === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 mb-4 justify-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" onClick={() => setFeedbackForm({...feedbackForm, rating: star})} className={`p-1 transition-all hover:scale-110 ${feedbackForm.rating >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                        <Star size={28} fill={feedbackForm.rating >= star ? "currentColor" : "none"} />
                                    </button>
                                    ))}
                                </div>
                                <textarea value={feedbackForm.message} onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})} rows={4} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm font-medium outline-none border border-transparent focus:border-orange-500 transition-colors" placeholder={`How was the ${feedbackForm.type.toLowerCase()} today?`} required />
                            </div>
                             <button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">Submit Review <Send size={16}/></button>
                          </form>
                      </div>

                      <div className="lg:col-span-2 space-y-8">
                          <section>
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-yellow-100 text-yellow-700 rounded-xl"><Award size={20} /></div>
                                  <div>
                                      <h3 className="font-black text-lg text-slate-900 dark:text-white">Today's Highlights</h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Rated • {new Date().toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {getTopReviews().length > 0 ? getTopReviews().map(r => (
                                      <div key={r.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 p-5 rounded-2xl border border-yellow-100 dark:border-slate-700 relative overflow-hidden">
                                          <Quote className="absolute top-4 right-4 text-yellow-500/20" size={40} />
                                          <div className="flex items-center gap-2 mb-3">
                                              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black shadow-sm">{r.user_name.charAt(0)}</div>
                                              <div>
                                                  <div className="text-xs font-bold text-slate-900 dark:text-white">{r.user_name}</div>
                                                  <div className="text-[10px] text-slate-500">{r.type}</div>
                                              </div>
                                          </div>
                                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic mb-3 relative z-10">"{r.message}"</p>
                                          <div className="flex gap-1">
                                              {Array.from({length: r.rating}).map((_, i) => <Star key={i} size={12} className="text-yellow-500 fill-current" />)}
                                          </div>
                                      </div>
                                  )) : (
                                      <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700">
                                          <p className="text-sm font-bold text-slate-400">No reviews for today yet. Be the first!</p>
                                      </div>
                                  )}
                              </div>
                          </section>

                          <section>
                              <h3 className="font-black text-lg text-slate-900 dark:text-white mb-4">Recent Feed</h3>
                              <div className="space-y-4">
                                  {getRecentReviews().map(r => (
                                      <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all">
                                          <div className="shrink-0 flex sm:flex-col items-center gap-2">
                                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm ${r.rating >= 4 ? 'bg-green-500' : r.rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                                  {r.rating}
                                              </div>
                                              <span className="text-[10px] font-bold text-slate-400">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex justify-between items-start">
                                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.type}</h4>
                                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{r.user_name}</span>
                                              </div>
                                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{r.message}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </section>
                      </div>
                  </div>
               </div>
            )}
            
            {activeTab === 'analytics' && user.role === 'ADMIN' && (
               <div className="max-w-7xl mx-auto space-y-8">
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                     <div>
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white">Admin Dashboard</h2>
                       <p className="text-sm text-slate-500 font-medium">Revenue, Occupancy, and Live Feedback.</p>
                     </div>
                     <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       {(['daily', 'weekly', 'monthly'] as const).map(t => (
                         <button 
                           key={t} 
                           onClick={() => setAnalyticsTimeframe(t)} 
                           className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${analyticsTimeframe === t ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                         >
                           {t}
                         </button>
                       ))}
                     </div>
                  </header>
                  
                  {analyticsData && (
                     <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <StatusCard title="Total Revenue" value={`₹${analyticsData.total_revenue.toLocaleString()}`} icon={DollarSign} color="bg-green-500 text-green-500" />
                            <StatusCard title="Avg Rating" value={analyticsData.avg_rating} icon={Star} color="bg-yellow-500 text-yellow-500" />
                            <StatusCard title="Active Tables" value={`${tableStatus?.occupied_tables || 0}/${TOTAL_TABLES}`} icon={Armchair} color="bg-blue-500 text-blue-500" />
                            <StatusCard title="Top Seller" value={analyticsData.top_items[0]?.name.split(' ')[0]} icon={Award} color="bg-purple-500 text-purple-500" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                           <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                             <div className="flex justify-between items-center mb-6">
                               <h3 className="font-bold text-lg dark:text-white">Revenue Trend</h3>
                               <div className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">+12.5% vs last {analyticsTimeframe}</div>
                             </div>
                             <div className="h-64">
                               <SimpleLineChart data={analyticsData.revenue_trend} />
                             </div>
                           </div>
                           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                             <h3 className="font-bold text-lg mb-6 dark:text-white">Sales Mix</h3>
                             <div className="flex flex-col items-center justify-center h-64">
                               <SimpleDoughnutChart data={analyticsData.category_split} />
                               <div className="mt-6 w-full space-y-2">
                                 {analyticsData.category_split.map((cat, i) => (
                                   <div key={i} className="flex justify-between text-xs font-bold">
                                      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></span> {cat.label}</span>
                                      <span className="dark:text-white">{cat.value}%</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                              <h3 className="font-bold text-lg mb-6 dark:text-white">Peak Occupancy</h3>
                              <div className="h-64">
                                 <SimpleBarChart data={analyticsData.occupancy_trend} />
                              </div>
                           </div>
                           
                           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                                  <MessageSquare className="text-blue-500" size={20}/> Live Customer Voice
                                </h3>
                                <button onClick={() => setActiveTab('feedback')} className="text-xs font-bold text-orange-600 hover:text-orange-700">View All</button>
                              </div>
                              
                              <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                                 {getAdminReviews().length > 0 ? getAdminReviews().map((r) => (
                                    <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                       <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black">{r.user_name.charAt(0)}</div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.user_name}</span>
                                          </div>
                                          <div className="flex text-yellow-400"><Star size={10} fill="currentColor"/> <span className="text-[10px] text-slate-400 ml-1 font-mono">{r.rating}.0</span></div>
                                       </div>
                                       <p className="text-xs italic text-slate-600 dark:text-slate-300 line-clamp-2">"{r.message}"</p>
                                       <div className="mt-2 flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase">{r.type}</span>
                                          <span className="text-[10px] text-slate-300">{new Date(r.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                       </div>
                                    </div>
                                 )) : (
                                   <div className="text-center py-10 text-slate-400 text-xs font-bold">No recent feedback available.</div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'admin' && user.role === 'ADMIN' && (
               <div className="max-w-md mx-auto space-y-8">
                  <header>
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white">Manage Menu</h2>
                     <p className="text-xs text-slate-500">Add or remove items.</p>
                  </header>
                  <form onSubmit={handleAddMenuItem} className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-sm dark:text-white flex items-center gap-2"><PlusCircle size={16} className="text-orange-500"/> Add New</h3>
                     <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 dark:text-white" placeholder="Item Name" required />
                     <div className="flex gap-3">
                        <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none dark:text-white" placeholder="Price" required />
                        <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none dark:text-white cursor-pointer"><option value="Snacks">Snacks</option><option value="Meals">Meals</option><option value="Beverages">Drinks</option></select>
                     </div>
                     <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-orange-100 dark:shadow-none hover:bg-orange-700 transition-all">Add Item</button>
                  </form>
                  
                  <div className="space-y-4">
                     <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><List size={16} className="text-blue-500"/> Current Inventory</h3>
                     <div className="grid grid-cols-1 gap-3">
                        {menu.map(item => (
                           <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center gap-3">
                                 <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                                 <div><div className="font-bold text-xs dark:text-white">{item.name}</div><div className="text-[10px] text-slate-400">₹{item.price} • {item.category}</div></div>
                              </div>
                              <button onClick={() => handleRemoveMenuItem(item.id, item.name)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16}/></button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </main>
         )}
         
         {activeTab === 'ordering' && cart.length > 0 && !isMobileCartOpen && (
            <div className="md:hidden fixed bottom-32 left-4 right-4 z-40 animate-bounce-in">
               <button onClick={() => setIsMobileCartOpen(true)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-95">
                  <div className="flex flex-col items-start">
                     <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">{cart.reduce((a,b)=>a+b.quantity,0)} ITEMS</span>
                     <span className="text-lg font-black leading-none mt-0.5">₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-sm">
                     View Cart <ShoppingBag size={18} />
                  </div>
               </button>
            </div>
         )}
         
         {user && (
           <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 p-2 rounded-full z-50 flex justify-between items-center shadow-2xl shadow-slate-200/50 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/5">
              <MobileNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <MobileNavItem icon={CreditCard} label="Order" active={activeTab === 'ordering'} onClick={() => setActiveTab('ordering')} />
              <MobileNavItem icon={Camera} label="Live" active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} />
              <MobileNavItem icon={MessageSquare} label="Buzz" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
               {user.role === "ADMIN" && (
                  <>
                     <MobileNavItem icon={BarChart3} label="Rev" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
                     <MobileNavItem icon={Settings} label="Admin" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} />
                  </>
               )}
           </nav>
         )}
      </div>

      {isMobileCartOpen && (
         <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)}></div>
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 pb-10 relative animate-bounce-in flex flex-col max-h-[85vh] shadow-2xl">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Your Cart</h3>
                  <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                  {cart.map(item => (
                     <div key={item.id} className="flex items-center gap-4">
                        <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-400">₹{item.price}</div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                           <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center"><Minus size={14}/></button>
                           <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center"><Plus size={14}/></button>
                        </div>
                     </div>
                  ))}
               </div>
               
               <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                  <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white">
                     <span>Total</span>
                     <span>₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                  </div>
                  <button onClick={() => setShowConfirmation(true)} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                     Pay via UPI <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[90vh] animate-bounce-in">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShoppingCart size={32} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Confirm Order</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Please review your items before paying.</p>
             </div>

             <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {cart.map(item => (
                     <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg overflow-hidden">
                              <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                           </div>
                           <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</div>
                              <div className="text-[10px] font-bold text-slate-400">{item.quantity} x ₹{item.price}</div>
                           </div>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">₹{item.price * item.quantity}</span>
                     </div>
                  ))}
                </div>
             </div>

             <div className="space-y-4 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex justify-between items-center text-xl font-black text-slate-900 dark:text-white">
                   <span>Total Amount</span>
                   <span className="text-orange-600 dark:text-orange-400">₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                </div>
                
                <div className="flex gap-3">
                   <button 
                      onClick={() => setShowConfirmation(false)} 
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={() => { setShowConfirmation(false); handlePayment('UPI'); }} 
                      className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                      Confirm & Pay
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT PROCESSING OVERLAY --- */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 animate-[pulse_2s_infinite]"></div>
            
            {/* Icon Animation */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-2 bg-orange-200 dark:bg-orange-800/20 rounded-full animate-pulse"></div>
              <div className="relative z-10 bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-orange-100 dark:border-slate-700">
                 <ShieldCheck size={32} className="text-orange-600 dark:text-orange-400" />
              </div>
              {/* Spinning Ring */}
              <div className="absolute inset-0 animate-spin">
                 <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Processing Payment</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
              Securely communicating with bank servers...
            </p>
            
            {/* Steps Animation */}
            <div className="flex gap-2 mt-6">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-[bounce_1s_infinite_0ms]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-[bounce_1s_infinite_200ms]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-[bounce_1s_infinite_400ms]"></div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[90vh]">
             {/* Progress Bar for Timer */}
             <div className="absolute top-0 left-0 h-1.5 bg-green-500 transition-all duration-1000 ease-linear" style={{ width: `${(receiptTimer / 120) * 100}%` }}></div>

             <div className="text-center mt-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                   <CheckCircle2 size={32} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Order Verified</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{showReceipt.id}</p>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(showReceipt.timestamp).toLocaleString()}</div>
             </div>

             <div className="my-6 border-y-2 border-dashed border-slate-100 dark:border-slate-800 py-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {showReceipt.items.map(item => (
                   <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-bold dark:text-slate-300">{item.quantity}x</div>
                         <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                   </div>
                ))}
             </div>

             <div className="space-y-4 shrink-0">
                <div className="flex justify-between items-center text-xl font-black text-slate-900 dark:text-white">
                   <span>Total Paid</span>
                   <span className="text-green-600 dark:text-green-400">₹{showReceipt.total}</span>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Show to Counter Staff</span>
                      <span className="text-xs text-orange-600/80 dark:text-orange-400/80">Valid for 2 minutes</span>
                   </div>
                   <div className="font-mono font-black text-orange-600 dark:text-orange-400 text-2xl tracking-tight flex items-center gap-2">
                     <Clock size={20} className="animate-pulse" />
                     {Math.floor(receiptTimer / 60)}:{(receiptTimer % 60).toString().padStart(2, '0')}
                   </div>
                </div>

                <button onClick={() => setShowReceipt(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                   <FileText size={18} /> Staff Use Only: Close Receipt
                </button>
             </div>
          </div>
        </div>
      )}

      {/* --- MOBILE RECOMMENDATION NOTIFICATION --- */}
      {showRecommendation && recommendation && (
        <div className="md:hidden fixed top-20 left-4 right-4 z-[110] animate-bounce-in">
           <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-4 rounded-3xl shadow-2xl shadow-orange-500/20 border border-orange-100 dark:border-slate-700 flex gap-4 relative overflow-hidden ring-1 ring-black/5">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 to-red-500"></div>
              <div className="shrink-0 relative">
                 <img src={recommendation.image} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={recommendation.name} />
                 <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                    <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                 </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1">
                       Today's Highlight
                    </span>
                    <button onClick={() => setShowRecommendation(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-2 -mt-2">
                       <X size={16} />
                    </button>
                 </div>
                 <h4 className="font-black text-slate-900 dark:text-white truncate text-lg leading-tight mb-2">{recommendation.name}</h4>
                 <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">₹{recommendation.price}</span>
                    <button 
                       onClick={() => { 
                          addToCart(recommendation); 
                          setShowRecommendation(false); 
                          setActiveTab('ordering'); 
                          showNotification(`${recommendation.name} added!`);
                       }} 
                       className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                       Order Now
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// --- Sub-components ---
const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all text-sm w-full text-left ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}>
    <Icon size={20} strokeWidth={active ? 3 : 2} />
    <span>{label}</span>
  </button>
);

const MobileNavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
   <button 
     onClick={onClick} 
     className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${active ? 'flex-grow bg-orange-600 text-white shadow-lg shadow-orange-500/30 px-5 mx-1' : 'w-12 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent'}`}
   >
      <Icon size={active ? 20 : 24} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {active && (
        <span className="ml-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden animate-fade-in">
          {label}
        </span>
      )}
   </button>
);

export default App;