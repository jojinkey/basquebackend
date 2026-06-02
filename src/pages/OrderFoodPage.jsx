import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkServiceability, placeDeliveryOrder } from '../services/deliveryOrderApi';
import { createOrder } from '../services/orderApi';
import { menuData } from '../data/menuData';
import styles from './OrderFoodPage.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const allItems = menuData.flatMap(cat =>
  cat.items.map(item => ({ ...item, category: cat.category }))
);

// ── Per-item unique images ──────────────────────────────────────────────────
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
  'morning in the garden':         'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=800&auto=format&fit=crop'
};

// ── Category fallback images ────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  "Mango Mania":      "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
  "Soups & Salads":   "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "Appetizers":       "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80",
  "Pizza & Pasta":    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
  "Indian & Tandoor": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  "Cocktails":        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80",
  "default":          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
};

// ── Updated getItemImage: Check specific item first, fallback to category ─
const getItemImage = (item) => {
  const key = item?.name?.toLowerCase().trim();
  if (key && ITEM_IMAGES[key]) return ITEM_IMAGES[key];
  return CATEGORY_IMAGES[item?.category] || CATEGORY_IMAGES["default"];
};

export default function OrderFoodPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, addToCart, updateQty, clearCart } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');

  // Cart tab: 'dine-in' | 'delivery'
  const [cartTab, setCartTab] = useState('dine-in');

  // Dine-in state
  const [tableId, setTableId] = useState('');
  const [dineInSubmitting, setDineInSubmitting] = useState(false);
  const [dineInSuccess, setDineInSuccess] = useState(false);

  // Delivery state
  const [pincode, setPincode] = useState('');
  const [serviceableStatus, setServiceableStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: 'Uttarakhand',
    deliveryPincode: '',
    paymentMethod: 'prepaid'
  });

  const categories = useMemo(() => ['All', ...menuData.map(cat => cat.category)], []);

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'All') return allItems;
    return allItems.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  const safeTotal = Number(cartTotal) || 0;
  const deliveryCharge = safeTotal >= 1500 ? 0 : 60;
  const finalTotal = safeTotal + (safeTotal > 0 ? deliveryCharge : 0);

  // ── Dine-in handler ──
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setDineInSubmitting(true);
    try {
      await createOrder({
        tableId: tableId || 'Walk-in',
        tableName: tableId || 'Walk-in',
        items: cartItems.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        total: safeTotal,
        status: 'new',
      });
      clearCart();
      setDineInSuccess(true);
      setTimeout(() => setDineInSuccess(false), 4000);
    } catch {
      alert('Failed to send order. Please try again.');
    } finally {
      setDineInSubmitting(false);
    }
  };

  // ── Delivery handlers ──
  const handleCheckPincode = async () => {
    if (pincode.length !== 6) return;
    setIsChecking(true);
    try {
      const res = await checkServiceability(pincode);
      setServiceableStatus(res.serviceable);
      if (res.serviceable) setFormData(prev => ({ ...prev, deliveryPincode: pincode }));
    } catch {
      setServiceableStatus(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!serviceableStatus) {
      alert('Please ensure your pincode is serviceable before checking out.');
      return;
    }
    try {
      const newOrder = await placeDeliveryOrder({ ...formData, items: cartItems });
      clearCart();
      navigate(`/order-tracking/${newOrder.id}`);
    } catch {
      alert('Failed to place order. Please try again.');
    }
  };

  // ── Shared cart summary ──
  const CartSummary = () => (
    <>
      <div className={styles.cartItems}>
        {cartItems.map(item => (
          <div key={item.name} className={styles.cartItemRow}>
            <div className={styles.cartItemInfo}>
              <span className={styles.cartItemName}>{item.name}</span>
              <span className={styles.cartItemQty}>× {item.qty}</span>
            </div>
            <span className={styles.cartItemPrice}>₹{Number(item.price) * Number(item.qty)}</span>
          </div>
        ))}
      </div>
      <div className={styles.totals}>
        <div className={styles.totalsRow}><span>Subtotal</span><span>₹{safeTotal}</span></div>
        {cartTab === 'delivery' && (
          <>
            <div className={styles.totalsRow}>
              <span>Delivery</span>
              <span className={deliveryCharge === 0 ? styles.free : ''}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
            </div>
            {safeTotal > 0 && safeTotal < 1500 && (
              <p className={styles.freeDeliveryHint}>Add ₹{1500 - safeTotal} more for free delivery</p>
            )}
            <div className={`${styles.totalsRow} ${styles.finalTotal}`}><span>Total</span><span>₹{finalTotal}</span></div>
          </>
        )}
        {cartTab === 'dine-in' && (
          <div className={`${styles.totalsRow} ${styles.finalTotal}`}><span>Total</span><span>₹{safeTotal}</span></div>
        )}
      </div>
    </>
  );

  return (
    <div className={styles.pageContainer}>

      {/* Hero */}
      <motion.section className={styles.hero} initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className={styles.headline}>Restaurant meals, your way.</h1>
        <p className={styles.subtext}>Dine in at your table, or get Basque quality delivered home.</p>
      </motion.section>

      {/* Category Tabs */}
      <motion.section className={styles.tabBar} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.tabBtn} ${activeCategory === cat ? styles.activeTab : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </motion.section>

      {/* Menu Grid + Cart */}
      <div className={styles.contentWrapper}>
        <div className={styles.menuGrid}>
          {filteredMenu.map(item => {
            const inCartItem = cartItems.find(c => c.name === item.name);
            const isNonVeg = item.name?.toLowerCase().match(/(chicken|prawn|fish|pork|mutton|lamb)/);
            
            // ── Call updated getItemImage passing the full item object ──
            const imgSrc = getItemImage(item);
            
            return (
              <motion.div key={item.name} className={styles.menuCard} layout>
                <div className={styles.cardImage}>
                  <img src={imgSrc} alt={item.name} loading="lazy" />
                  <span className={`${styles.vegBadge} ${isNonVeg ? styles.nonVeg : styles.veg}`}>
                    {isNonVeg ? '🔴' : '🟢'}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  {item.desc ? <p className={styles.itemDesc}>{item.desc}</p> : null}
                  <div className={styles.cardFooter}>
                    <span className={styles.price}>₹{item.price}</span>
                    {!inCartItem ? (
                      <button className={styles.btnAdd} onClick={() => addToCart({ ...item, qty: 1 })}>Add +</button>
                    ) : (
                      <div className={styles.qtyControls}>
                        <button onClick={() => updateQty(item.name, inCartItem.qty - 1)}>−</button>
                        <span>{inCartItem.qty}</span>
                        <button onClick={() => updateQty(item.name, inCartItem.qty + 1)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cart Panel */}
        <div className={styles.cartPanel}>
          <h2 className={styles.cartTitle}>Your Cart</h2>

          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <span>🛒</span>
              <p>Your cart is empty</p>
              <small>Add items from the menu</small>
            </div>
          ) : (
            <>
              {/* ── Cart Mode Tabs ── */}
              <div className={styles.cartTabs}>
                <button
                  className={`${styles.cartTabBtn} ${cartTab === 'dine-in' ? styles.cartTabActive : ''}`}
                  onClick={() => { setCartTab('dine-in'); setShowCheckout(false); }}
                >
                  🍽 Dine-In
                </button>
                <button
                  className={`${styles.cartTabBtn} ${cartTab === 'delivery' ? styles.cartTabActive : ''}`}
                  onClick={() => setCartTab('delivery')}
                >
                  🚚 Delivery
                </button>
              </div>

              <CartSummary />

              {/* ── Dine-In Tab Content ── */}
              {cartTab === 'dine-in' && (
                <div className={styles.dineInSection}>
                  <input
                    className={styles.tableInput}
                    type="text"
                    placeholder="Table / Name (optional)"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  />
                  {dineInSuccess ? (
                    <div className={`${styles.pill} ${styles.pillGreen}`} style={{ textAlign: 'center', width: '100%' }}>
                      ✓ Order sent to kitchen!
                    </div>
                  ) : (
                    <button
                      className={styles.btnCheckout}
                      onClick={handleSendToKitchen}
                      disabled={dineInSubmitting}
                    >
                      {dineInSubmitting ? 'Sending...' : 'Send Order to Kitchen →'}
                    </button>
                  )}
                </div>
              )}

              {/* ── Delivery Tab Content ── */}
              {cartTab === 'delivery' && (
                <div className={styles.deliverySection}>
                  {/* Pincode checker */}
                  <div className={styles.pincodeCheckerCart}>
                    <input
                      type="text"
                      placeholder="Enter Pincode (e.g. 248001)"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckPincode()}
                    />
                    <button onClick={handleCheckPincode} disabled={isChecking || pincode.length !== 6}>
                      {isChecking ? '...' : 'Check'}
                    </button>
                  </div>

                  {serviceableStatus === true && (
                    <div className={`${styles.pill} ${styles.pillGreen}`}>✓ We deliver to {pincode}</div>
                  )}
                  {serviceableStatus === false && (
                    <div className={`${styles.pill} ${styles.pillRed}`}>✕ We don't deliver here yet</div>
                  )}

                  <button
                    className={styles.btnCheckout}
                    onClick={() => setShowCheckout(true)}
                    disabled={!serviceableStatus}
                    style={!serviceableStatus ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                  >
                    Proceed to Checkout →
                  </button>

                  {/* Checkout Form */}
                  <AnimatePresence>
                    {showCheckout && serviceableStatus && (
                      <motion.form
                        className={styles.checkoutForm}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCheckoutSubmit}
                      >
                        <h3 className={styles.checkoutTitle}>Delivery Details</h3>
                        <input required type="text" name="customerName" placeholder="Full Name *" onChange={handleFormChange} />
                        <input required type="tel" name="customerPhone" placeholder="Phone (10 digits) *" pattern="[0-9]{10}" onChange={handleFormChange} />
                        <input type="email" name="customerEmail" placeholder="Email (Optional)" onChange={handleFormChange} />
                        <textarea required name="deliveryAddress" placeholder="Delivery Address *" onChange={handleFormChange} rows={3} />
                        <div className={styles.row}>
                          <input required type="text" name="deliveryCity" placeholder="City *" onChange={handleFormChange} />
                          <input readOnly type="text" name="deliveryState" value="Uttarakhand" className={styles.readOnly} />
                        </div>
                        <input
                          required type="text" name="deliveryPincode" placeholder="Pincode *" pattern="[0-9]{6}"
                          value={formData.deliveryPincode || pincode}
                          onChange={(e) => { handleFormChange(e); setPincode(e.target.value); }}
                          onBlur={handleCheckPincode}
                        />
                        <div className={styles.paymentMethods}>
                          <p className={styles.paymentLabel}>Payment Method</p>
                          <label className={styles.radioLabel}>
                            <input type="radio" name="paymentMethod" value="prepaid" checked={formData.paymentMethod === 'prepaid'} onChange={handleFormChange} />
                            Pay Online
                          </label>
                          <label className={styles.radioLabel}>
                            <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleFormChange} />
                            Cash on Delivery
                          </label>
                        </div>
                        <button type="submit" className={styles.btnSubmitOrder}>Place Order →</button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}