import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { menuData } from '../data/menuData'
import { createOrder } from '../services/orderApi'
import { callWaiter, requestBill } from '../services/serviceRequestApi'
import './MenuPage.css'

const IMAGE_RULES = [
  { keyword: 'thai raw mango salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'mango paneer tikka', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'mango chilli chicken', url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { keyword: 'mango curry veg', url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'mango curry chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'margherita', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'butter chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'chicken biryani', url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=1200&auto=format&fit=crop' },
  { keyword: 'mutton biryani', url: 'https://images.pexels.com/photos/9609868/pexels-photo-9609868.jpeg?auto=compress&cs=tinysrgb&w=1200' }
]

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop'

const TEXT = {
  en: {
    title: 'Digital Table Menu',
    subtitle: 'Browse the menu, add your favourites, and send your order directly to the kitchen.',
    yourOrder: 'Your Cart',
    noItems: 'Your cart is empty. Add items from the menu',
    total: 'Total',
    add: 'Add',
    noFilteredItems: 'No items found for this filter.',
    callWaiter: 'Call Waiter',
    callingWaiter: 'Calling...',
    requestBill: 'Request Bill',
    requestingBill: 'Requesting...',
    sendOrder: 'Send Order to Kitchen',
    sendingOrder: 'Sending...',
    all: 'All',
    veg: 'Veg',
    nonVeg: 'Non-Veg',
    vegan: 'Vegan'
  },
  hi: {
    title: 'डिजिटल टेबल मेन्यू',
    subtitle: 'मेन्यू देखें, अपनी पसंद जोड़ें और ऑर्डर सीधे किचन में भेजें।',
    yourOrder: 'आपका कार्ट',
    noItems: 'कार्ट खाली है। मेन्यू से आइटम जोड़ें।',
    total: 'कुल',
    add: 'जोड़ें',
    noFilteredItems: 'इस फिल्टर में कोई आइटम नहीं मिला।',
    callWaiter: 'वेटर बुलाएं',
    callingWaiter: 'बुलाया जा रहा है...',
    requestBill: 'बिल मंगाएं',
    requestingBill: 'मांगा जा रहा है...',
    sendOrder: 'ऑर्डर किचन में भेजें',
    sendingOrder: 'भेजा जा रहा है...',
    all: 'सभी',
    veg: 'वेज',
    nonVeg: 'नॉन-वेज',
    vegan: 'वीगन'
  }
}

const HINDI_MENU = {
  'Thai Raw Mango Salad': 'थाई रॉ मैंगो सलाद',
  'Mango Paneer Tikka': 'मैंगो पनीर टिक्का',
  'Mango Chilli Chicken': 'मैंगो चिली चिकन',
  'Butter Chicken': 'बटर चिकन',
  'Chicken Biryani': 'चिकन बिरयानी',
  'Mutton Biryani': 'मटन बिरयानी'
}

const getDietType = item => {
  const name = item.name.toLowerCase()
  if (name.includes('chicken') || name.includes('prawn') || name.includes('fish') || name.includes('mutton') || name.includes('pepperoni') || name.includes('non veg')) return 'nonVeg'
  if (name.includes('raw mango') || name.includes('aam panna') || name.includes('pahadi cooler') || name.includes('fries') || name.includes('quinoa') || name.includes('edamame')) return 'vegan'
  return 'veg'
}

const getDisplayName = (item, language) => {
  if (language === 'hi') return HINDI_MENU[item.name] || item.name
  return item.name
}

function MenuPage() {
  const { tableId } = useParams()
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState(menuData[0]?.category || '')
  const [activeTable, setActiveTable] = useState('Digital Menu Overview')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCallingWaiter, setIsCallingWaiter] = useState(false)
  const [isRequestingBill, setIsRequestingBill] = useState(false)
  const [language, setLanguage] = useState(sessionStorage.getItem('basque_language') || 'en')
  const [dietFilter, setDietFilter] = useState(sessionStorage.getItem('basque_diet_filter') || 'all')

  const t = TEXT[language]

  useEffect(() => {
    if (tableId) {
      const formattedTable = tableId.replaceAll('-', ' ').replace(/\b\w/g, char => char.toUpperCase())
      localStorage.setItem('basque_current_table', formattedTable)
      setActiveTable(formattedTable)
    } else {
      const persistedTable = localStorage.getItem('basque_current_table')
      setActiveTable(persistedTable || 'Digital Menu Overview')
    }
  }, [tableId])

  useEffect(() => sessionStorage.setItem('basque_language', language), [language])
  useEffect(() => sessionStorage.setItem('basque_diet_filter', dietFilter), [dietFilter])

  const filteredMenu = menuData.find(section => section.category === activeCategory)

  const filteredItems = useMemo(() => {
    const items = filteredMenu?.items || []
    if (dietFilter === 'all') return items
    return items.filter(item => getDietType(item) === dietFilter)
  }, [filteredMenu, dietFilter])

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0), [cart])

  const addToCart = item => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.name === item.name)
      if (existing) return prev.map(cartItem => cartItem.name === item.name ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const increaseQty = name => setCart(prev => prev.map(item => item.name === name ? { ...item, qty: item.qty + 1 } : item))
  const decreaseQty = name => setCart(prev => prev.map(item => item.name === name ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0))

  const sendOrderToKitchen = async () => {
    if (cart.length === 0) return alert('Please add items to cart first.')
    try {
      setIsSubmitting(true)
      const orderData = {
        tableId: tableId || 'digital-menu',
        tableName: activeTable,
        items: cart.map(item => ({ name: item.name, price: item.price || 0, qty: item.qty })),
        total,
        status: 'new'
      }
      const result = await createOrder(orderData)
      if (result?.offline) alert(`Internet issue. Order saved offline.`)
      else alert(`Order sent to kitchen!`)
      setCart([])
    } catch (error) {
      alert('Failed to send order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCallWaiter = async () => {
    try {
      setIsCallingWaiter(true)
      await callWaiter({ tableId: tableId || 'digital-menu', tableName: activeTable })
      alert(`Waiter called for ${activeTable}`)
    } catch (error) {
      alert('Failed to call waiter.')
    } finally {
      setIsCallingWaiter(false)
    }
  }

  const handleBillRequest = async () => {
    try {
      setIsRequestingBill(true)
      await requestBill({ tableId: tableId || 'digital-menu', tableName: activeTable })
      alert(`Bill requested for ${activeTable}`)
    } catch (error) {
      alert('Failed to request bill.')
    } finally {
      setIsRequestingBill(false)
    }
  }

  const getItemImage = item => {
    if (item?.image) return item.image
    if (!item?.name) return DEFAULT_IMAGE
    const nameNormalized = item.name.toLowerCase()
    const exactMatch = IMAGE_RULES.find(rule => nameNormalized.includes(rule.keyword))
    return !exactMatch || exactMatch.url.includes('<') ? DEFAULT_IMAGE : exactMatch.url
  }

  return (
    <main className="menuPage">
      <section className="menuHero">
        <p className="eyebrow">Basque Dehradun</p>
        <h1>{t.title}</h1>
        <div className="tableBadgeWrapper">
          <span className="tableBadge">{activeTable}</span>
        </div>
        <p className="menuSubtext">{t.subtitle}</p>
        
        <div className="heroToggleGroup">
          <button className={`heroToggleBtn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>
            English
          </button>
          <button className={`heroToggleBtn ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>
            हिंदी
          </button>
        </div>

        <div className="heroToggleGroup" style={{ marginTop: '14px' }}>
          {['all', 'veg', 'nonVeg', 'vegan'].map(filter => (
            <button key={filter} className={`heroToggleBtn ${dietFilter === filter ? 'active' : ''}`} onClick={() => setDietFilter(filter)}>
              {t[filter]}
            </button>
          ))}
        </div>
      </section>

      <section className="menuLayout">
        <div className="leftContent">
          <div className="categoryList">
            {menuData.map(section => (
              <button
                key={section.category}
                className={activeCategory === section.category ? 'active' : ''}
                onClick={() => setActiveCategory(section.category)}
              >
                {section.category}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="emptyCart">{t.noFilteredItems}</p>
          ) : (
            <div className="itemsGrid">
              {filteredItems.map(item => {
                const cartItem = cart.find(c => c.name === item.name)
                const currentQty = cartItem ? cartItem.qty : 0

                return (
                  <article className="menuCard" key={item.name}>
                    <div className="cardImageWrapper">
                      <div className="dietIndicator">
                        <span className={`dot ${getDietType(item)}`}></span>
                      </div>
                      <img src={getItemImage(item)} alt={item.name} loading="lazy" className="foodImg" />
                    </div>
                    
                    <div className="cardContent">
                      <div className="cardInfo">
                        <h3>{getDisplayName(item, language)}</h3>
                        {item.desc && <p>{item.desc}</p>}
                      </div>
                      
                      <div className="cardBottom">
                        <span className="itemPrice">₹{item.price || '0'}</span>
                        {currentQty === 0 ? (
                          <button className="cardAddBtn" onClick={() => addToCart(item)}>{t.add} +</button>
                        ) : (
                          <div className="qtyControls cardQtyControls">
                            <button onClick={() => decreaseQty(item.name)}>-</button>
                            <span>{currentQty}</span>
                            <button onClick={() => increaseQty(item.name)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="cartPanel">
          <h3>{t.yourOrder}</h3>
          
          {cart.length === 0 ? (
            <div className="emptyCart">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: '12px' }}>
                <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <p>{t.noItems}</p>
            </div>
          ) : (
            <>
              <div className="cartItems">
                {cart.map(item => (
                  <div className="cartItem" key={item.name}>
                    <div className="cartItemInfo">
                      <h4>{getDisplayName(item, language)}</h4>
                      <p>₹{(item.price || 0) * item.qty}</p>
                    </div>
                    <div className="qtyControls">
                      <button onClick={() => decreaseQty(item.name)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => increaseQty(item.name)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cartTotal">
                <span>{t.total}</span>
                <strong>₹{total}</strong>
              </div>
            </>
          )}

          <div style={{ display: 'grid', gap: '10px', marginTop: '24px' }}>
            <button className="actionBtn" onClick={handleCallWaiter} disabled={isCallingWaiter}>
              {isCallingWaiter ? t.callingWaiter : t.callWaiter}
            </button>
            <button className="actionBtn" onClick={handleBillRequest} disabled={isRequestingBill}>
              {isRequestingBill ? t.requestingBill : t.requestBill}
            </button>
            <button className="actionBtn highlight" onClick={sendOrderToKitchen} disabled={isSubmitting || cart.length === 0}>
              {isSubmitting ? t.sendingOrder : t.sendOrder}
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default MenuPage