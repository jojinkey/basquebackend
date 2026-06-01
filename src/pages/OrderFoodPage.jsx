import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkServiceability, placeDeliveryOrder } from '../services/deliveryOrderApi';
import { menuData } from '../data/menuData';
import styles from './OrderFoodPage.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const allItems = menuData.flatMap(cat =>
  cat.items.map(item => ({ ...item, category: cat.category }))
);

const CATEGORY_IMAGES = {
  "Mango Mania":      "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
  "Soups & Salads":   "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "Appetizers":       "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80",
  "Pizza & Pasta":    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
  "Indian & Tandoor": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  "Cocktails":        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80",
  "default":          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
};

const getItemImage = (category) => CATEGORY_IMAGES[category] || CATEGORY_IMAGES["default"];

export default function OrderFoodPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, addToCart, updateQty, clearCart } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');
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
      alert("Please ensure your pincode is serviceable before checking out.");
      return;
    }
    try {
      const newOrder = await placeDeliveryOrder({ ...formData, items: cartItems });
      clearCart();
      navigate(`/order-tracking/${newOrder.id}`);
    } catch {
      alert("Failed to place order. Please try again.");
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* Hero */}
      <motion.section className={styles.hero} initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className={styles.headline}>Restaurant meals, at your door.</h1>
        <p className={styles.subtext}>Experience Basque quality from the comfort of your home.</p>
        <div className={styles.pincodeChecker}>
          <input
            type="text"
            placeholder="Enter Pincode (e.g. 248001)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckPincode()}
          />
          <button onClick={handleCheckPincode} disabled={isChecking || pincode.length !== 6}>
            {isChecking ? 'Checking...' : 'Check'}
          </button>
        </div>
        {serviceableStatus === true && <div className={`${styles.pill} ${styles.pillGreen}`}>✓ We deliver to {pincode}</div>}
        {serviceableStatus === false && <div className={`${styles.pill} ${styles.pillRed}`}>✕ We don't deliver here yet</div>}
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
            const imgSrc = getItemImage(item.category);
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
                <div className={styles.totalsRow}>
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? styles.free : ''}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                {safeTotal > 0 && safeTotal < 1500 && (
                  <p className={styles.freeDeliveryHint}>Add ₹{1500 - safeTotal} more for free delivery</p>
                )}
                <div className={`${styles.totalsRow} ${styles.finalTotal}`}><span>Total</span><span>₹{finalTotal}</span></div>
              </div>
              <button className={styles.btnCheckout} onClick={() => setShowCheckout(true)}>Proceed to Checkout</button>
            </>
          )}

          {/* Checkout Form */}
          <AnimatePresence>
            {showCheckout && cartItems.length > 0 && (
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
      </div>
    </div>
  );
}