import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { menuData } from '../data/menuData'
import { createOrder } from '../services/orderApi'
import { callWaiter, requestBill } from '../services/serviceRequestApi'
import './MenuPage.css'

const IMAGE_RULES = [
  {
    keyword: 'thai raw mango salad',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'mango paneer tikka',
    url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'mango chilli chicken',
    url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'mango curry veg',
    url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'mango curry chicken',
    url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'mango curry prawn',
    url: '/images/thai-yellow-curry-prawn.png'
  },
  {
    keyword: 'mango cheesecake',
    url: '/images/mango-cheeseckae.png'
  },
  {
    keyword: 'mango tiramisu',
    url: '/images/mango-tiramisu.png'
  },
  {
    keyword: 'aam panna',
    url: '/images/aam-panna.png'
  },
  {
    keyword: 'mango shake',
    url: '/images/thick-mango-shake.png'
  },
  {
    keyword: 'mango pahadi cooler',
    url: '/images/mango-pahadi-cooler.png'
  },
  {
    keyword: 'roast chicken',
    url: '/images/roast-chicken.png'
  },
  {
    keyword: 'cream of mushroom',
    url: '/images/cream-of-mushroom.png'
  },
  {
    keyword: 'mexican corn salad',
    url: '/images/mexican-corn-salad.png'
  },
  {
    keyword: 'quinoa edamame',
    url: '/images/quinoa-edamame-salad.png'
  },
  {
    keyword: 'chicken caesar salad',
    url: '/images/cc.png'
  },
  {
    keyword: 'caesar salad',
    url: '/images/caesar-salad-veg.png'
  },
  {
    keyword: 'fiamma',
    url: '/images/fiama.png'
  },
  {
    keyword: 'burrata pizza',
    url: '/images/burata.png'
  },
  {
    keyword: 'genovese',
    url: '/images/genovese.png'
  },
  {
    keyword: 'funghi',
    url: '/images/al-fun.png'
  },
  {
    keyword: 'chicken tikka pizza',
    url: '/images/chicken.png'
  },
  {
    keyword: 'lasagna',
    url: '/images/baked.png'
  },
  {
    keyword: 'ravioli',
    url: '/images/truffle.png'
  },
  {
    keyword: 'margherita',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'butter chicken',
    url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'chicken biryani',
    url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'mutton biryani',
    url: 'https://images.pexels.com/photos/9609868/pexels-photo-9609868.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
]

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop'

const TEXT = {
  en: {
    title: 'Digital Table Menu',
    subtitle:
      'Browse the menu, add your favourites, and send your order directly to the kitchen.',
    categories: 'Categories',
    yourOrder: 'Your Order',
    noItems: 'No items added yet.',
    total: 'Total',
    add: 'Add',
    items: 'items',
    noFilteredItems: 'No items found for this filter.',
    callWaiter: 'Call Waiter',
    callingWaiter: 'Calling Waiter...',
    requestBill: 'Request Bill',
    requestingBill: 'Requesting Bill...',
    sendOrder: 'Send Order to Kitchen',
    sendingOrder: 'Sending Order...',
    all: 'All',
    veg: 'Veg',
    nonVeg: 'Non-Veg',
    vegan: 'Vegan'
  },
  hi: {
    title: 'डिजिटल टेबल मेन्यू',
    subtitle:
      'मेन्यू देखें, अपनी पसंद जोड़ें और ऑर्डर सीधे किचन में भेजें।',
    categories: 'श्रेणियां',
    yourOrder: 'आपका ऑर्डर',
    noItems: 'अभी कोई आइटम नहीं जोड़ा गया।',
    total: 'कुल',
    add: 'जोड़ें',
    items: 'आइटम',
    noFilteredItems: 'इस फिल्टर में कोई आइटम नहीं मिला।',
    callWaiter: 'वेटर बुलाएं',
    callingWaiter: 'वेटर बुलाया जा रहा है...',
    requestBill: 'बिल मंगाएं',
    requestingBill: 'बिल मांगा जा रहा है...',
    sendOrder: 'ऑर्डर किचन में भेजें',
    sendingOrder: 'ऑर्डर भेजा जा रहा है...',
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
  'Mango Burrata Bomb': 'मैंगो बुराटा बॉम्ब',
  'Mango Curry Veg': 'मैंगो करी वेज',
  'Mango Curry Chicken': 'मैंगो करी चिकन',
  'Mango Curry Prawn': 'मैंगो करी प्रॉन',
  'Mango Cheesecake': 'मैंगो चीज़केक',
  'Mango Tiramisu': 'मैंगो तिरामिसू',
  'Aam Panna': 'आम पन्ना',
  'Mango Shake': 'मैंगो शेक',
  'Mango Pahadi Cooler': 'मैंगो पहाड़ी कूलर',
  'Cream of Mushroom': 'क्रीम ऑफ मशरूम',
  'Mexican Corn Salad': 'मैक्सिकन कॉर्न सलाद',
  'Quinoa Edamame Salad': 'क्विनोआ एडामामे सलाद',
  'Caesar Salad': 'सीज़र सलाद',
  'Chicken Caesar Salad': 'चिकन सीज़र सलाद',
  'Margherita Pizza': 'मार्घेरिटा पिज़्ज़ा',
  'Fiamma Pizza': 'फियम्मा पिज़्ज़ा',
  'Burrata Pizza': 'बुराटा पिज़्ज़ा',
  'Genovese Pizza': 'जेनोवेज़ पिज़्ज़ा',
  'Al Funghi Pizza': 'अल फंगी पिज़्ज़ा',
  'Chicken Tikka Pizza': 'चिकन टिक्का पिज़्ज़ा',
  'Truffle Cream Ravioli': 'ट्रफल क्रीम रवियोली',
  'Baked Lasagna': 'बेक्ड लज़ान्या',
  'Butter Chicken': 'बटर चिकन',
  'Chicken Biryani': 'चिकन बिरयानी',
  'Mutton Biryani': 'मटन बिरयानी'
}

const getDietType = item => {
  const name = item.name.toLowerCase()

  if (
    name.includes('chicken') ||
    name.includes('prawn') ||
    name.includes('fish') ||
    name.includes('mutton') ||
    name.includes('pepperoni') ||
    name.includes('non veg')
  ) {
    return 'nonVeg'
  }

  if (
    name.includes('raw mango') ||
    name.includes('aam panna') ||
    name.includes('pahadi cooler') ||
    name.includes('fries') ||
    name.includes('quinoa') ||
    name.includes('edamame')
  ) {
    return 'vegan'
  }

  return 'veg'
}

const getDisplayName = (item, language) => {
  if (language === 'hi') {
    return HINDI_MENU[item.name] || item.name
  }

  return item.name
}

function MenuPage() {
  const { tableId } = useParams()

  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState(
    menuData[0]?.category || ''
  )
  const [activeTable, setActiveTable] = useState('Digital Menu')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCallingWaiter, setIsCallingWaiter] = useState(false)
  const [isRequestingBill, setIsRequestingBill] = useState(false)

  const [language, setLanguage] = useState(
    sessionStorage.getItem('basque_language') || 'en'
  )

  const [dietFilter, setDietFilter] = useState(
    sessionStorage.getItem('basque_diet_filter') || 'all'
  )

  const t = TEXT[language]

  useEffect(() => {
    if (tableId) {
      const formattedTable = tableId
        .replaceAll('-', ' ')
        .replace(/\b\w/g, char => char.toUpperCase())

      localStorage.setItem('basque_current_table', formattedTable)
      setActiveTable(formattedTable)
    } else {
      const persistedTable = localStorage.getItem('basque_current_table')
      setActiveTable(persistedTable || 'Digital Menu Overview')
    }
  }, [tableId])

  useEffect(() => {
    sessionStorage.setItem('basque_language', language)
  }, [language])

  useEffect(() => {
    sessionStorage.setItem('basque_diet_filter', dietFilter)
  }, [dietFilter])

  const filteredMenu = menuData.find(
    section => section.category === activeCategory
  )

  const filteredItems = useMemo(() => {
    const items = filteredMenu?.items || []

    if (dietFilter === 'all') return items

    return items.filter(item => getDietType(item) === dietFilter)
  }, [filteredMenu, dietFilter])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [cart])

  const addToCart = item => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.name === item.name)

      if (existing) {
        return prev.map(cartItem =>
          cartItem.name === item.name
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        )
      }

      return [...prev, { ...item, qty: 1 }]
    })
  }

  const increaseQty = name => {
    setCart(prev =>
      prev.map(item =>
        item.name === name ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = name => {
    setCart(prev =>
      prev
        .map(item =>
          item.name === name ? { ...item, qty: item.qty - 1 } : item
        )
        .filter(item => item.qty > 0)
    )
  }

  const sendOrderToKitchen = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart first.')
      return
    }

    try {
      setIsSubmitting(true)

      const orderData = {
        tableId: tableId || 'digital-menu',
        tableName: activeTable,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty
        })),
        total,
        status: 'new'
      }

      const result = await createOrder(orderData)

      if (result?.offline) {
        alert(
          `Internet issue. Order saved offline for ${activeTable}. It will be sent when connection returns.`
        )
      } else {
        alert(`Order sent to kitchen successfully from ${activeTable}!`)
      }

      setCart([])
    } catch (error) {
      console.log(error)
      alert('Failed to send order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCallWaiter = async () => {
    try {
      setIsCallingWaiter(true)

      await callWaiter({
        tableId: tableId || 'digital-menu',
        tableName: activeTable
      })

      alert(`Waiter called for ${activeTable}`)
    } catch (error) {
      console.log(error)
      alert('Failed to call waiter. Please try again.')
    } finally {
      setIsCallingWaiter(false)
    }
  }

  const handleBillRequest = async () => {
    try {
      setIsRequestingBill(true)

      await requestBill({
        tableId: tableId || 'digital-menu',
        tableName: activeTable
      })

      alert(`Bill requested for ${activeTable}`)
    } catch (error) {
      console.log(error)
      alert('Failed to request bill. Please try again.')
    } finally {
      setIsRequestingBill(false)
    }
  }

  const getItemImage = item => {
    if (item?.image) return item.image
    if (!item?.name) return DEFAULT_IMAGE

    const nameNormalized = item.name.toLowerCase()
    const exactMatch = IMAGE_RULES.find(rule =>
      nameNormalized.includes(rule.keyword)
    )

    if (!exactMatch || exactMatch.url.includes('<')) {
      return DEFAULT_IMAGE
    }

    return exactMatch.url
  }

  return (
    <main className="menuPage">
      <section className="menuHero">
        <p className="eyebrow">Basque Dehradun</p>

        <h1>{t.title}</h1>

        <p className="tableBadge">{activeTable}</p>

        <p className="menuSubtext">{t.subtitle}</p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '18px'
          }}
        >
          <button
            className="cardAddBtn"
            onClick={() => setLanguage('en')}
            style={{ opacity: language === 'en' ? 1 : 0.65 }}
          >
            English
          </button>

          <button
            className="cardAddBtn"
            onClick={() => setLanguage('hi')}
            style={{ opacity: language === 'hi' ? 1 : 0.65 }}
          >
            हिंदी
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '14px'
          }}
        >
          {['all', 'veg', 'nonVeg', 'vegan'].map(filter => (
            <button
              key={filter}
              className="cardAddBtn"
              onClick={() => setDietFilter(filter)}
              style={{ opacity: dietFilter === filter ? 1 : 0.65 }}
            >
              {t[filter]}
            </button>
          ))}
        </div>
      </section>

      <section className="menuLayout">
        <aside className="categoryPanel">
          <h3>{t.categories}</h3>

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
        </aside>

        <section className="itemsPanel">
          <div className="itemsHeader">
            <h2>{filteredMenu?.category}</h2>
            <p>
              {filteredItems.length} {t.items}
            </p>
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
                    <div className="cardTop">
                      <div className="cardInfo">
                        <h3>{getDisplayName(item, language)}</h3>
                        {item.desc && <p>{item.desc}</p>}
                      </div>

                      <div className="cardImageWrapper">
                        <img
                          src={getItemImage(item)}
                          alt={item.name}
                          loading="lazy"
                          className="foodImg"
                        />
                      </div>
                    </div>

                    <div className="cardBottom">
                      <span>₹{item.price}</span>

                      {currentQty === 0 ? (
                        <button
                          className="cardAddBtn"
                          onClick={() => addToCart(item)}
                        >
                          {t.add}
                        </button>
                      ) : (
                        <div className="qtyControls cardQtyControls">
                          <button onClick={() => decreaseQty(item.name)}>
                            -
                          </button>
                          <span>{currentQty}</span>
                          <button onClick={() => increaseQty(item.name)}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="cartPanel">
          <h3>{t.yourOrder}</h3>
          <p className="cartTable">{activeTable}</p>

          {cart.length === 0 ? (
            <p className="emptyCart">{t.noItems}</p>
          ) : (
            <div className="cartItems">
              {cart.map(item => (
                <div className="cartItem" key={item.name}>
                  <div>
                    <h4>{getDisplayName(item, language)}</h4>
                    <p>₹{item.price * item.qty}</p>
                  </div>

                  <div className="qtyControls">
                    <button onClick={() => decreaseQty(item.name)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => increaseQty(item.name)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cartTotal">
            <span>{t.total}</span>
            <strong>₹{total}</strong>
          </div>

          <button
            className="whatsappBtn"
            onClick={handleCallWaiter}
            disabled={isCallingWaiter}
          >
            {isCallingWaiter ? t.callingWaiter : t.callWaiter}
          </button>

          <button
            className="whatsappBtn"
            onClick={handleBillRequest}
            disabled={isRequestingBill}
          >
            {isRequestingBill ? t.requestingBill : t.requestBill}
          </button>

          <button
            className="whatsappBtn"
            onClick={sendOrderToKitchen}
            disabled={isSubmitting}
          >
            {isSubmitting ? t.sendingOrder : t.sendOrder}
          </button>
        </aside>
      </section>
    </main>
  )
}

export default MenuPage