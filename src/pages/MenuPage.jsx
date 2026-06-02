import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import './MenuPage.css';

// ── Text Dictionaries ────────────────────────────────────────────────────────
const TEXT = {
  en: {
    subtitle: "Experience the finest culinary journey in the heart of Uttarakhand.",
    all: "All",
    veg: "Veg",
    nonVeg: "Non-Veg",
    vegan: "Vegan",
    addToCart: "Add to Cart",
    cart: "Your Table's Order",
    emptyCart: "Your cart is empty.",
    total: "Total",
    orderNow: "Send to Kitchen",
    callWaiter: "Call Waiter",
    requestBill: "Request Bill",
    search: "Search menu..."
  },
  hi: {
    subtitle: "उत्तराखंड के हृदय में बेहतरीन पाक यात्रा का अनुभव करें।",
    all: "सभी",
    veg: "शाकाहारी",
    nonVeg: "मांसाहारी",
    vegan: "वीगन",
    addToCart: "कार्ट में डालें",
    cart: "आपकी टेबल का ऑर्डर",
    emptyCart: "आपका कार्ट खाली है।",
    total: "कुल",
    orderNow: "किचन में भेजें",
    callWaiter: "वेटर बुलाएं",
    requestBill: "बिल मांगें",
    search: "मेनू खोजें..."
  }
};

// ── Per-item image overrides ──────────────────────────────────────────────
const ITEM_IMAGES = {
  'thai raw mango salad':          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
  'mango paneer tikka':            'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800&auto=format&fit=crop',
  'mango chilli chicken':          'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
  'mango burrata bomb':            'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
  'thai yellow mango curry veg':   'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800&auto=format&fit=crop',
  'thai yellow mango curry chicken':'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop',
  'thai yellow mango curry prawn': 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=800&auto=format&fit=crop',
  'mango cheesecake':              'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
  'mango tiramisu':                'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800&auto=format&fit=crop',
  'aam panna':                     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
  'thicc mango shake':             'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop',
  'mango lassi':                   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop',
  'spiked aam panna':              'https://images.pexels.com/photos/3407777/pexels-photo-3407777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'mango pahadi cooler':           'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=800&auto=format&fit=crop',
  'cream of mushroom':             'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop',
  'minestrone':                    'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?q=80&w=800&auto=format&fit=crop',
  'roast chicken & herb veloute':  'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop',
  'mediterranean salad':           'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop',
  'mexican corn salad':            'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?q=80&w=800&auto=format&fit=crop',
  'quinoa edamame salad':          'https://images.unsplash.com/photo-1511357840105-748c4693f02a?q=80&w=800&auto=format&fit=crop',
  'caesar salad veg':              'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=800&auto=format&fit=crop',
  'caesar salad chicken':          'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=800&auto=format&fit=crop',
  'hummus, tzatziki & pita':       'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop',
  'pesto mushrooms':               'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=800&auto=format&fit=crop',
  'loaded nachos':                 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=800&auto=format&fit=crop',
  'cheese fondue':                 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop',
  'french fries salted':           'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop',
  'french fries peri peri':        'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=800&auto=format&fit=crop',
  'french fries truffle':          'https://images.unsplash.com/photo-1598679253544-2c97992403ea?q=80&w=800&auto=format&fit=crop',
  'basque fried chicken':          'https://images.unsplash.com/photo-1562802378-063ec186a863?q=80&w=800&auto=format&fit=crop',
  'fish fingers':                  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'butter garlic prawns':          'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=800&auto=format&fit=crop',
  'margherita pizza':              'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
  'fiamma pizza':                  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop',
  'burrata pizza':                 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?q=80&w=800&auto=format&fit=crop',
  'genovese pizza':                'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
  'al funghi pizza':               'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
  'chicken tikka pizza':           'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800',
  'pork pepperoni pizza':          'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop',
  'pasta':                         'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=80&w=800&auto=format&fit=crop',
  'truffle cream ravioli':         'https://images.unsplash.com/photo-1633504581786-316c8002b1b9?q=80&w=800&auto=format&fit=crop',
  'baked lasagna':                 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=800&auto=format&fit=crop',
  'mini truffle kulcha':           'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=800',
  'paneer khurchan mini tacos':    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop',
  'butter chicken fondue':         'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop',
  'mini vada pav':                 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800',
  'doon bun tikki':                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
  'basque paneer tikka':           'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800&auto=format&fit=crop',
  'malai chicken tikka boneless':  'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
  'vegetarian tandoori platter':   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop',
  'non-vegetarian tandoori platter':'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800',
  'basque dal makhni':             'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=800',
  'paneer lababdar':               'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800&auto=format&fit=crop',
  'basque classic butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop',
  'chicken biryani':               'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=800&auto=format&fit=crop',
  'mutton biryani':                'https://images.pexels.com/photos/9609868/pexels-photo-9609868.jpeg?auto=compress&cs=tinysrgb&w=800',
  'rodo sour':                     'https://images.unsplash.com/photo-1560508180-03f285f67ded?q=80&w=800&auto=format&fit=crop',
  'thyme trails':                  'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=800&auto=format&fit=crop',
  'sacred grove':                  'https://images.unsplash.com/photo-1582106245687-127b7b16ea1b?q=80&w=800&auto=format&fit=crop',
  'rosewood calm':                 'https://images.unsplash.com/photo-1587015990127-424b954b333d?q=80&w=800&auto=format&fit=crop',
  'garden bloom':                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
  'caramel cloud':                 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop',
  'wild ember':                    'https://images.unsplash.com/photo-1551751299-1b51cab2694c?q=80&w=800&auto=format&fit=crop',
  'morning in the garden':         'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=800&auto=format&fit=crop',
};

// ── Category fallback images ──────────────────────────────────────────────
const CATEGORY_IMAGES = {
  'Mango Mania':     'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=800&auto=format&fit=crop',
  'Soups & Salads':  'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop',
  'Appetizers':      'https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=800&auto=format&fit=crop',
  'Pizza & Pasta':   'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
  'Indian & Tandoor':'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop',
  'Cocktails':       'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=800&auto=format&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';

// ── Expanded Menu Data ────────────────────────────────────────────────────
const MENU_DATA = [
  // Appetizers
  { id: 1, category: 'Appetizers', name: 'Hummus, Tzatziki & Pita', price: 450, diet: 'veg', desc: 'Served with warm pita' },
  { id: 2, category: 'Appetizers', name: 'Basque Fried Chicken', price: 550, diet: 'nonVeg', desc: 'Crispy and spiced to perfection' },
  { id: 3, category: 'Appetizers', name: 'Butter Garlic Prawns', price: 700, diet: 'nonVeg', desc: 'Tossed in rich burnt garlic butter' },
  { id: 4, category: 'Appetizers', name: 'French Fries Truffle', price: 400, diet: 'vegan', desc: 'Crispy fries tossed in truffle oil' },

  // Pizza & Pasta
  { id: 5, category: 'Pizza & Pasta', name: 'Margherita Pizza', price: 600, diet: 'veg', desc: 'Classic cheese & tomato' },
  { id: 6, category: 'Pizza & Pasta', name: 'Pork Pepperoni Pizza', price: 750, diet: 'nonVeg', desc: 'Spicy pepperoni slices' },
  { id: 7, category: 'Pizza & Pasta', name: 'Truffle Cream Ravioli', price: 650, diet: 'veg', desc: 'Handmade ravioli in truffle cream' },
  { id: 8, category: 'Pizza & Pasta', name: 'Chicken Tikka Pizza', price: 700, diet: 'nonVeg', desc: 'Fusion pizza with tandoori chicken chunks' },

  // Mango Mania
  { id: 9, category: 'Mango Mania', name: 'Mango Burrata Bomb', price: 650, diet: 'veg', desc: 'Fresh burrata with mango pureé' },
  { id: 10, category: 'Mango Mania', name: 'Thai Yellow Mango Curry Veg', price: 550, diet: 'veg', desc: 'Rich and creamy Thai curry' },
  { id: 11, category: 'Mango Mania', name: 'Mango Chilli Chicken', price: 600, diet: 'nonVeg', desc: 'Spicy and sweet mango glaze' },
  { id: 12, category: 'Mango Mania', name: 'Spiked Aam Panna', price: 450, diet: 'vegan', desc: 'Refreshing summer cooler with a twist' },

  // Soups & Salads
  { id: 13, category: 'Soups & Salads', name: 'Cream of Mushroom', price: 350, diet: 'veg', desc: 'Rich and earthy mushroom soup' },
  { id: 14, category: 'Soups & Salads', name: 'Caesar Salad Chicken', price: 450, diet: 'nonVeg', desc: 'Classic Caesar with grilled chicken' },
  { id: 15, category: 'Soups & Salads', name: 'Quinoa Edamame Salad', price: 400, diet: 'vegan', desc: 'Healthy, crisp, and refreshing' },

  // Indian & Tandoor
  { id: 16, category: 'Indian & Tandoor', name: 'Basque Paneer Tikka', price: 500, diet: 'veg', desc: 'Charcoal roasted paneer' },
  { id: 17, category: 'Indian & Tandoor', name: 'Chicken Biryani', price: 650, diet: 'nonVeg', desc: 'Aromatic basmati with tender chicken' },
  { id: 18, category: 'Indian & Tandoor', name: 'Basque Dal Makhni', price: 450, diet: 'veg', desc: 'Overnight slow-cooked black lentils' },
  { id: 19, category: 'Indian & Tandoor', name: 'Mini Truffle Kulcha', price: 350, diet: 'veg', desc: 'Stuffed kulchas with a hint of truffle' },

  // Cocktails
  { id: 20, category: 'Cocktails', name: 'Rodo Sour', price: 750, diet: 'vegan', desc: 'Our signature whiskey sour' },
  { id: 21, category: 'Cocktails', name: 'Wild Ember', price: 800, diet: 'vegan', desc: 'Smoky, robust, and complex' },
  { id: 22, category: 'Cocktails', name: 'Garden Bloom', price: 700, diet: 'vegan', desc: 'Gin infused with fresh botanicals' }
];

export default function MenuPage() {
  const { tableId } = useParams();
  const [activeTable, setActiveTable] = useState(tableId || localStorage.getItem('basque_tableId') || 'Walk-in');
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return sessionStorage.getItem('basque_theme') || 'auto';
  });

  // App States
  const [language, setLanguage] = useState('en');
  const [dietFilter, setDietFilter] = useState('all');
  const [cart, setCart] = useState([]);
  
  // New States for Search & Categories
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const t = TEXT[language];
  
  // Prepend 'All' to the unique categories list
  const categories = useMemo(() => ['All', ...new Set(MENU_DATA.map(item => item.category))], []);

  // Theme Side Effect
  useEffect(() => {
    sessionStorage.setItem('basque_theme', theme);
    const root = document.documentElement;
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    return () => root.removeAttribute('data-theme');
  }, [theme]);

  // Persist Table ID
  useEffect(() => {
    if (tableId) {
      localStorage.setItem('basque_tableId', tableId);
      setActiveTable(tableId);
    }
  }, [tableId]);

  // Logic Functions
  const getItemImage = (item, category) => {
    if (item?.image) return item.image;
    const key = item?.name?.toLowerCase().trim();
    if (key && ITEM_IMAGES[key]) return ITEM_IMAGES[key];
    if (category && CATEGORY_IMAGES[category]) return CATEGORY_IMAGES[category];
    return DEFAULT_IMAGE;
  };

  const getDietType = (item) => item.diet || 'veg';

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const increaseQty = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decreaseQty = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0));
  
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.qty), 0), [cart]);

  const sendOrderToKitchen = () => { console.log('Order sent:', cart); setCart([]); alert('Order Sent to Kitchen!'); };
  const callWaiter = () => { console.log('Waiter called to table', activeTable); alert('Waiter is on the way.'); };
  const requestBill = () => { console.log('Bill requested for table', activeTable); alert('Bill is being prepared.'); };
  const createOrder = () => { sendOrderToKitchen(); };

  // Filter Items by Category, Diet, AND Search Query
  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    return MENU_DATA.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesDiet = dietFilter === 'all' || item.diet === dietFilter;
      const matchesSearch = item.name.toLowerCase().includes(lowerQuery) || item.desc.toLowerCase().includes(lowerQuery);
      
      return matchesCategory && matchesDiet && matchesSearch;
    });
  }, [activeCategory, dietFilter, searchQuery]);

  return (
    <div className="menuPage">
      {/* ── PREMIUM HERO SECTION ────────────────────────────────────────────── */}
      <section className="menuHero">
        <div className="heroRule">
          <span className="heroRuleLine" />
          <span className="heroRuleDot" />
          <span className="heroRuleLine" />
        </div>

        <p className="eyebrow">Basque · Dehradun</p>

        <h1 className="heroTitle">
          <span className="heroTitleTop">Digital</span>
          <span className="heroTitleMain">Table Menu</span>
        </h1>

        <div className="tableBadgeWrapper">
          <span className="tableBadge">
            <span className="tableBadgeIcon">⌖</span>
            {activeTable}
          </span>
        </div>

        <p className="menuSubtext">{t.subtitle}</p>

        <div className="heroControls">
          <div className="heroToggleGroup">
            <button className={`heroToggleBtn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            <button className={`heroToggleBtn ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>हि</button>
          </div>

          <div className="heroToggleGroup">
            {['all', 'veg', 'nonVeg', 'vegan'].map(filter => (
              <button key={filter} className={`heroToggleBtn ${dietFilter === filter ? 'active' : ''}`} onClick={() => setDietFilter(filter)}>
                {t[filter]}
              </button>
            ))}
          </div>

          <div className="heroToggleGroup">
            <button className={`heroToggleBtn themeBtn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} aria-label="Light mode">☀ Light</button>
            <button className={`heroToggleBtn themeBtn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} aria-label="Dark mode">☾ Dark</button>
            <button className={`heroToggleBtn themeBtn ${theme === 'auto' ? 'active' : ''}`} onClick={() => setTheme('auto')} aria-label="Auto mode">Auto</button>
          </div>
        </div>

        <div className="heroRule heroRuleBottom">
          <span className="heroRuleLine" />
        </div>
      </section>

      {/* ── CATEGORY & SEARCH STRIP ────────────────────────────────────────── */}
      <div className="menuControlsRow">
        <div className="categoryList">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={activeCategory === cat ? 'active' : ''} 
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="searchBarWrapper">
          <span className="searchIcon">⌕</span>
          <input 
            type="text" 
            className="searchInput" 
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── MAIN CONTENT (GRID + CART) ──────────────────────────────────────── */}
      <div className="menuContentGrid">
        <div className="menuItemsContainer">
          {categories.filter(cat => cat !== 'All' && (activeCategory === 'All' || activeCategory === cat)).map(currentCat => {
            const itemsInCat = filteredItems.filter(item => item.category === currentCat);
            
            // Skip rendering if category has no items (due to filters or search)
            if (itemsInCat.length === 0) return null;

            return (
              <div key={currentCat} className="categoryGroup">
                {activeCategory === 'All' && (
                  <h2 className="categorySectionTitle">{currentCat}</h2>
                )}
                
                <div className="itemsGrid">
                  {itemsInCat.map(item => (
                    <div key={item.id} className="menuCard">
                      <div className="cardImageWrapper">
                        <div className="dietIndicator">
                          <span className={`dot ${getDietType(item)}`}></span>
                        </div>
                        <img
                          src={getItemImage(item, currentCat)}
                          alt={item.name}
                          loading="lazy"
                          className="foodImg"
                        />
                        <div className="cardImgOverlay" />
                      </div>
                      
                      <div className="cardInfo">
                        <h3>{item.name}</h3>
                        <p>{item.desc}</p>
                        <div className="cardFooter">
                          <span className="itemPrice">₹{item.price}</span>
                          <button className="addBtn" onClick={() => addToCart(item)}>{t.addToCart}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── CART PANEL ────────────────────────────────────────────────────── */}
        <aside className="cartPanel">
          <h3>{t.cart}</h3>
          
          {cart.length === 0 ? (
            <p className="emptyCart">{t.emptyCart}</p>
          ) : (
            <div className="cartItems">
              {cart.map(item => (
                <div key={item.id} className="cartItem">
                  <div className="cartItemInfo">
                    <h4>{item.name}</h4>
                    <p>₹{item.price}</p>
                  </div>
                  <div className="qtyControls">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>
                </div>
              ))}
              <div className="cartSummary">
                <h4 className="cartTotal">{t.total}: ₹{cartTotal}</h4>
                <button className="primaryBtn" onClick={createOrder}>{t.orderNow}</button>
              </div>
            </div>
          )}
          
          <div className="actionButtons">
            <button className="secondaryBtn" onClick={callWaiter}>{t.callWaiter}</button>
            <button className="secondaryBtn" onClick={requestBill}>{t.requestBill}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}