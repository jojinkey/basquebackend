import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { menuData } from '../data/menuData'
import './MenuPage.css'

const WHATSAPP_NUMBER = '919999999999'

// ========================================================================
// FINAL PREMIUM VERIFIED IMAGE DATABASE
// ========================================================================

const IMAGE_RULES = [
  // =========================================================
  // MANGO SPECIALS
  // =========================================================

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
    url: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'mango cheesecake',
    url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'mango tiramisu',
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'aam panna',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'mango lassi',
    url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'mango shake',
    url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'mango pahadi cooler',
    url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=1200&auto=format&fit=crop'
  },

  // =========================================================
  // SOUPS & SALADS
  // =========================================================

  {
    keyword: 'roast chicken',
    url: 'https://images.pexels.com/photos/233305/pexels-photo-233305.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'cream of mushroom',
    url: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop'
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
    url: 'https://images.pexels.com/photos/12316410/pexels-photo-12316410.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'quinoa edamame',
    url: 'https://images.pexels.com/photos/5951680/pexels-photo-5951680.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'chicken caesar salad',
    url: 'https://images.pexels.com/photos/18314141/pexels-photo-18314141/free-photo-of-salad-with-grilled-chicken-breast.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'caesar salad',
    url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1200&auto=format&fit=crop'
  },

  // =========================================================
  // APPETIZERS
  // =========================================================

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

  // =========================================================
  // PIZZAS
  // =========================================================

  {
    keyword: 'margherita',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'fiamma',
    url: 'https://images.unsplash.com/photo-1548365328-9f547fb0953b?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'burrata pizza',
    url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'genovese',
    url: 'https://images.unsplash.com/photo-1593246049226-ded77bf90326?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'funghi',
    url: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'chicken tikka pizza',
    url: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'pepperoni',
    url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1200&auto=format&fit=crop'
  },

  // =========================================================
  // PASTA
  // =========================================================

  {
    keyword: 'basque lasagna',
    url: 'https://images.pexels.com/photos/4057739/pexels-photo-4057739.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'lasagna',
    url: 'https://images.pexels.com/photos/4057739/pexels-photo-4057739.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },

  {
    keyword: 'pasta',
    url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=80&w=1200&auto=format&fit=crop'
  },

  {
    keyword: 'ravioli',
    url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=1200&auto=format&fit=crop'
  },

  // =========================================================
  // INDIAN
  // =========================================================

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
    url: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=1200&auto=format&fit=crop'
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
  url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1200&auto=format&fit=crop'
},

{
  keyword: 'non veg tandoori platter',
  url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'
},
{
    keyword: 'dal makhni',
    url: 'https://images.pexels.com/photos/12737665/pexels-photo-12737665.jpeg?auto=compress&cs=tinysrgb&w=1200'
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

  // =========================================================
  // COCKTAILS
  // =========================================================

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
  const { tableId } = useParams()

  const [cart, setCart] = useState([])

  const [activeCategory, setActiveCategory] = useState(
    menuData[0]?.category || ''
  )

  const tableName = tableId
    ? tableId.replace('-', ' ').replace(/\b\w/g, char =>
        char.toUpperCase()
      )
    : 'Table'

  const filteredMenu = menuData.find(
    section => section.category === activeCategory
  )

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    )
  }, [cart])

  const addToCart = item => {
    setCart(prev => {
      const existing = prev.find(
        cartItem => cartItem.name === item.name
      )

      if (existing) {
        return prev.map(cartItem =>
          cartItem.name === item.name
            ? {
                ...cartItem,
                qty: cartItem.qty + 1
              }
            : cartItem
        )
      }

      return [...prev, { ...item, qty: 1 }]
    })
  }

  const increaseQty = name => {
    setCart(prev =>
      prev.map(item =>
        item.name === name
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    )
  }

  const decreaseQty = name => {
    setCart(prev =>
      prev
        .map(item =>
          item.name === name
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter(item => item.qty > 0)
    )
  }

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Please add items to cart first.')
      return
    }

    const orderItems = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} x${item.qty} - ₹${
            item.price * item.qty
          }`
      )
      .join('\n')

    const message = `New Order - Basque
${tableName}

${orderItems}

Total: ₹${total}

Please confirm this order.`

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`

    window.open(whatsappUrl, '_blank')
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

        <p className="tableBadge">{tableName}</p>

        <p className="menuSubtext">
          Browse the menu, add your favourites,
          and place your order directly on WhatsApp.
        </p>
      </section>

      <section className="menuLayout">
        <aside className="categoryPanel">
          <h3>Categories</h3>

          <div className="categoryList">
            {menuData.map(section => (
              <button
                key={section.category}
                className={
                  activeCategory === section.category
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveCategory(section.category)
                }
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
              const cartItem = cart.find(
                c => c.name === item.name
              )

              const currentQty = cartItem
                ? cartItem.qty
                : 0

              return (
                <article
                  className="menuCard"
                  key={item.name}
                >
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
                        <button
                          onClick={() =>
                            decreaseQty(item.name)
                          }
                        >
                          -
                        </button>

                        <span>{currentQty}</span>

                        <button
                          onClick={() =>
                            increaseQty(item.name)
                          }
                        >
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

          <p className="cartTable">{tableName}</p>

          {cart.length === 0 ? (
            <p className="emptyCart">
              No items added yet.
            </p>
          ) : (
            <div className="cartItems">
              {cart.map(item => (
                <div
                  className="cartItem"
                  key={item.name}
                >
                  <div>
                    <h4>{item.name}</h4>

                    <p>
                      ₹{item.price * item.qty}
                    </p>
                  </div>

                  <div className="qtyControls">
                    <button
                      onClick={() =>
                        decreaseQty(item.name)
                      }
                    >
                      -
                    </button>

                    <span>{item.qty}</span>

                    <button
                      onClick={() =>
                        increaseQty(item.name)
                      }
                    >
                      +
                    </button>
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
            onClick={sendOrderToWhatsApp}
          >
            Place Order on WhatsApp
          </button>
        </aside>
      </section>
    </main>
  )
}

export default MenuPage