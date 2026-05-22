import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { menuData } from '../data/menuData'
import './MenuPage.css'

const WHATSAPP_NUMBER = '919999999999'

function MenuPage() {
  const { tableId } = useParams()
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState(menuData[0]?.category || '')

  const tableName = tableId
    ? tableId.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase())
    : 'Table'

  const filteredMenu = menuData.find(section => section.category === activeCategory)

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

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Please add items to cart first.')
      return
    }

    const orderItems = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} x${item.qty} - ₹${item.price * item.qty}`
      )
      .join('\n')

    const message = `New Order - Basque\n${tableName}\n\n${orderItems}\n\nTotal: ₹${total}\n\nPlease confirm this order.`

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`

    window.open(whatsappUrl, '_blank')
  }

  return (
    <main className="menuPage">
      <section className="menuHero">
        <p className="eyebrow">Basque Dehradun</p>
        <h1>Digital Table Menu</h1>
        <p className="tableBadge">{tableName}</p>
        <p className="menuSubtext">
          Browse the menu, add your favourites, and place your order directly on WhatsApp.
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
            {filteredMenu?.items.map(item => (
              <article className="menuCard" key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  {item.desc && <p>{item.desc}</p>}
                </div>

                <div className="cardBottom">
                  <span>₹{item.price}</span>
                  <button onClick={() => addToCart(item)}>Add</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="cartPanel">
          <h3>Your Order</h3>
          <p className="cartTable">{tableName}</p>

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

          <button className="whatsappBtn" onClick={sendOrderToWhatsApp}>
            Place Order on WhatsApp
          </button>
        </aside>
      </section>
    </main>
  )
}

export default MenuPage