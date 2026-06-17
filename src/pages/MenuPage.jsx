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
    keyword: 'mango burrata bomb',
    url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop'
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
    keyword: 'mango lassi',
    url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?q=80&w=1200&auto=format&fit=crop'
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
    keyword: 'minestrone',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'herb veloute',
    url: 'https://images.pexels.com/photos/11504369/pexels-photo-11504369.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'veloute',
    url: 'https://images.pexels.com/photos/11504369/pexels-photo-11504369.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'mediterranean salad',
    url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200&auto=format&fit=crop'
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
    keyword: 'hummus pita',
    url: 'https://images.pexels.com/photos/13444453/pexels-photo-13444453.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'hummus',
    url: 'https://images.pexels.com/photos/13444453/pexels-photo-13444453.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'pesto mushrooms',
    url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'loaded nachos',
    url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'cheese fondue',
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'salted fries',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'peri peri fries',
    url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'truffle fries',
    url: 'https://images.pexels.com/photos/18970427/pexels-photo-18970427/free-photo-of-gourmet-french-fries.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'fried chicken',
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'fish fingers',
    url: 'https://images.pexels.com/photos/10184852/pexels-photo-10184852.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'butter garlic prawns',
    url: 'https://images.pexels.com/photos/3763792/pexels-photo-3763792.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'margherita',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop'
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
    keyword: 'pepperoni',
    url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'basque lasagna',
    url: 'https://images.pexels.com/photos/4057739/pexels-photo-4057739.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'lasagna',
    url: '/images/baked.png'
  },
  {
    keyword: 'pasta',
    url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'ravioli',
    url: '/images/truffle.png'
  },
  {
    keyword: 'kulcha',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'paneer khurchan',
    url: 'https://images.pexels.com/photos/20857371/pexels-photo-20857371/free-photo-of-close-up-of-traditional-tacos.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'vada pav',
    url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'bun tikki',
    url: '< >'
  },
  {
    keyword: 'paneer tikka',
    url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'malai chicken tikka',
    url: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'veg tandoori platter',
    url: '<>'
  },
  {
    keyword: 'non veg tandoori platter',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'dal makhni',
    url: '<>'
  },
  {
    keyword: 'lababdar',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1200&auto=format&fit=crop'
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
  },
  {
    keyword: 'rodo sour',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'thyme trails',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'sacred grove',
    url: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'rosewood calm',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'garden bloom',
    url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=1200&auto=format&fit=crop'
  },
  {
    keyword: 'caramel cloud',
    url: 'https://images.pexels.com/photos/1189257/pexels-photo-1189257.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'wild ember',
    url: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    keyword: 'morning in the garden',
    url: 'https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
]

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop'

function MenuPage() {
  const { tableId: rawTableId } = useParams()
  const tableId = useMemo(() => {
    const activeId = rawTableId || localStorage.getItem('basque_current_table_id') || 'digital-menu';
    if (typeof activeId === 'string') {
      const match = activeId.match(/^([tT])(\d+)$/)
      if (match) return 'T' + match[2]
    }
    return activeId
  }, [rawTableId])

  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState(
    menuData[0]?.category || ''
  )
  const [activeTable, setActiveTable] = useState('Digital Menu')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCallingWaiter, setIsCallingWaiter] = useState(false)
  const [isRequestingBill, setIsRequestingBill] = useState(false)

  useEffect(() => {
    if (tableId && tableId !== 'digital-menu') {
      const formattedTable = tableId
        .replaceAll('-', ' ')
        .replace(/\b\w/g, char => char.toUpperCase())

      localStorage.setItem('basque_current_table', formattedTable)
      localStorage.setItem('basque_current_table_id', tableId)
      setActiveTable(formattedTable)
    } else {
      const persistedTable = localStorage.getItem('basque_current_table')
      setActiveTable(persistedTable || 'Digital Menu Overview')
    }
  }, [tableId])

  const filteredMenu = menuData.find(
    section => section.category === activeCategory
  )

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
        status: 'pending_approval'
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

    return exactMatch ? exactMatch.url : DEFAULT_IMAGE
  }

  return (
    <main className="menuPage">
      <section className="menuHero">
        <p className="eyebrow">Basque Dehradun</p>
        <h1>Digital Table Menu</h1>
        <p className="tableBadge">{activeTable}</p>
        <p className="menuSubtext">
          Browse the menu, add your favourites, and send your order directly to
          the kitchen.
        </p>
      </section>

      <section className="menuLayout">
        <aside className="categoryPanel">
          <h3>Categories</h3>

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
            <p>{filteredMenu?.items.length} items</p>
          </div>

          <div className="itemsGrid">
            {filteredMenu?.items.map(item => {
              const cartItem = cart.find(c => c.name === item.name)
              const currentQty = cartItem ? cartItem.qty : 0

              return (
                <article className="menuCard" key={item.name}>
                  <div className="cardTop">
                    <div className="cardInfo">
                      <h3>{item.name}</h3>
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
                        Add
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
        </section>

        <aside className="cartPanel">
          <h3>Your Order</h3>
          <p className="cartTable">{activeTable}</p>

          {cart.length === 0 ? (
            <p className="emptyCart">No items added yet.</p>
          ) : (
            <div className="cartItems">
              {cart.map(item => (
                <div className="cartItem" key={item.name}>
                  <div>
                    <h4>{item.name}</h4>
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
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>

          <button
            className="whatsappBtn"
            onClick={handleCallWaiter}
            disabled={isCallingWaiter}
          >
            {isCallingWaiter ? 'Calling Waiter...' : 'Call Waiter'}
          </button>

          <button
            className="whatsappBtn"
            onClick={handleBillRequest}
            disabled={isRequestingBill}
          >
            {isRequestingBill ? 'Requesting Bill...' : 'Request Bill'}
          </button>

          <button
            className="whatsappBtn"
            onClick={sendOrderToKitchen}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Order...' : 'Send Order to Kitchen'}
          </button>
        </aside>
      </section>
    </main>
  )
}

export default MenuPage