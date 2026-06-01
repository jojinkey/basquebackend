import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { tablesApi } from "../../services/api";
import { menuData } from "../../data/menuData";
import { createOrder } from "../../services/orderApi";
import { useAuth } from "../../context/AuthContext";
import "./TableOrdering.css";

const INITIAL_FILTER = { table: "all", section: "all", status: "active" };

function getTableBadge(status) {
  switch (status) {
    case "available":
      return "badge-available";
    case "occupied":
      return "badge-occupied";
    case "reserved":
      return "badge-reserved";
    case "needs_bussing":
      return "badge-bussing";
    default:
      return "";
  }
}

export default function TableOrdering() {
  const { can } = useAuth();
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [filters, setFilters] = useState(INITIAL_FILTER);
  const [selectedTableId, setSelectedTableId] = useState(null);

  const [activeCategory, setActiveCategory] = useState(menuData[0]?.category ?? "");
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await tablesApi.getAll();
        setTables(res.data || []);
        if (!selectedTableId && res.data?.length) {
          const preferred = res.data.find((t) => t.status === "occupied") || res.data[0];
          setSelectedTableId(preferred.tableId);
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load tables right now.");
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, [selectedTableId]);

  const sections = useMemo(() => {
    const uniqueSections = new Set(tables.map((t) => t.section).filter(Boolean));
    return ["all", ...uniqueSections];
  }, [tables]);

  const tableOptions = useMemo(
    () => tables.map((t) => ({ id: t.tableId, name: t.tableName })),
    [tables]
  );

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesTable = filters.table === "all" || table.tableId === filters.table;
      const matchesSection = filters.section === "all" || table.section === filters.section;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active"
          ? ["occupied", "reserved"].includes(table.status)
          : table.status === filters.status);
      return matchesTable && matchesSection && matchesStatus;
    });
  }, [tables, filters]);

  const selectedTable = useMemo(
    () => tables.find((t) => t.tableId === selectedTableId) || null,
    [tables, selectedTableId]
  );

  const activeMenu = menuData.find((section) => section.category === activeCategory);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.name === item.name);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.name === item.name
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const increaseQty = (name) => {
    setCart((prev) =>
      prev.map((item) => (item.name === name ? { ...item, qty: item.qty + 1 } : item))
    );
  };

  const decreaseQty = (name) => {
    setCart((prev) =>
      prev
        .map((item) => (item.name === name ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      toast.error("Select a table to place the order.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Add at least one item to the cart.");
      return;
    }

    try {
      setSubmitting(true);
      const orderPayload = {
        tableId: selectedTable.tableId,
        tableName: selectedTable.tableName,
        items: cart.map((item) => ({ name: item.name, price: item.price, qty: item.qty })),
        total,
        status: "new",
      };

      const response = await createOrder(orderPayload);

      if (response?.offline) {
        toast.success(
          `Table ${selectedTable.tableName}: saved offline, will sync automatically.`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Order sent to kitchen for ${selectedTable.tableName}.`);
      }

      clearCart();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!can("table_orders")) {
    return (
      <div className="emptyState">
        <span className="emptyStateIcon">🔒</span>
        <p className="emptyStateText">You do not have access to the table ordering module.</p>
      </div>
    );
  }

  return (
    <div className="tableOrdering">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Table Ordering</h2>
          <p className="dashPanelSub">
            Create orders on behalf of guests · {tables.length} tables synced
          </p>
        </div>
        <div className="orderingActions">
          <button
            className="btnSecondary"
            onClick={() => setFilters(INITIAL_FILTER)}
            disabled={
              filters.table === INITIAL_FILTER.table &&
              filters.section === INITIAL_FILTER.section &&
              filters.status === INITIAL_FILTER.status
            }
          >
            Reset Filters
          </button>
          <button className="btnSecondary" onClick={clearCart} disabled={!cart.length}>
            Clear Cart
          </button>
        </div>
      </div>

      <div className="orderingLayout">
        <aside className="orderingSidebar">
          <div className="orderingFilters">
            <div className="filterRow">
              <label>Table</label>
              <select
                value={filters.table}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, table: value }));
                  if (value !== "all") {
                    setSelectedTableId(value);
                  }
                }}
              >
                <option value="all">All Tables</option>
                {tableOptions.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterRow">
              <label>Section</label>
              <select
                value={filters.section}
                onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
              >
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section === "all" ? "All Sections" : section}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterRow">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active Guests</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="needs_bussing">Needs Cleaning</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>

          <div className="tableList">
            {loadingTables ? (
              <div className="emptyState">
                <span className="emptyStateIcon">⌛</span>
                <p className="emptyStateText">Loading tables...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="emptyState">
                <span className="emptyStateIcon">🍽️</span>
                <p className="emptyStateText">No tables match the filters.</p>
              </div>
            ) : (
              filteredTables.map((table) => (
                <button
                  key={table.tableId}
                  className={`tableListItem ${selectedTableId === table.tableId ? "active" : ""}`}
                  onClick={() => setSelectedTableId(table.tableId)}
                >
                  <div className="tableListHeader">
                    <span className="tableListName">{table.tableName}</span>
                    <span className={`tableStatus ${getTableBadge(table.status)}`}>
                      {table.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="tableListMeta">
                    <span>{table.section}</span>
                    <span>{table.pax} pax</span>
                    {table.guest && <span className="guestChip">Guest: {table.guest}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="orderingMenu">
          <div className="menuHeader">
            <div>
              <h3 className="menuTitle">Menu</h3>
              <p className="menuSubtitle">{activeMenu?.items.length || 0} items</p>
            </div>
            <div className="categoryChips">
              {menuData.map((section) => (
                <button
                  key={section.category}
                  className={`categoryChip ${section.category === activeCategory ? "selected" : ""}`}
                  onClick={() => setActiveCategory(section.category)}
                >
                  {section.category}
                </button>
              ))}
            </div>
          </div>

          <div className="menuGrid">
            {activeMenu?.items.map((item) => {
              const cartItem = cart.find((c) => c.name === item.name);
              const qty = cartItem?.qty ?? 0;

              return (
                <article className="menuItem" key={item.name}>
                  <div className="menuItemContent">
                    <h4>{item.name}</h4>
                    {item.desc && <p>{item.desc}</p>}
                  </div>
                  <div className="menuItemActions">
                    <span className="menuPrice">₹{item.price}</span>
                    {qty === 0 ? (
                      <button className="menuAdd" onClick={() => addToCart(item)}>
                        Add
                      </button>
                    ) : (
                      <div className="qtyControls">
                        <button onClick={() => decreaseQty(item.name)}>-</button>
                        <span>{qty}</span>
                        <button onClick={() => increaseQty(item.name)}>+</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="orderingCart">
          <div className="cartHeader">
            <h3>Order Summary</h3>
            <p>{selectedTable ? selectedTable.tableName : "Select a table"}</p>
          </div>

          <div className="cartItems">
            {cart.length === 0 ? (
              <p className="emptyCart">No items yet. Build the order from the menu.</p>
            ) : (
              cart.map((item) => (
                <div className="cartItem" key={item.name}>
                  <div>
                    <p className="cartItemName">{item.name}</p>
                    <p className="cartItemMeta">₹{item.price} · Qty {item.qty}</p>
                  </div>
                  <div className="qtyControls compact">
                    <button onClick={() => decreaseQty(item.name)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => increaseQty(item.name)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cartFooter">
            <div className="cartTotal">
              <span>Total</span>
              <strong>₹{total}</strong>
            </div>

            <button
              className="submitOrder"
              onClick={handleSubmitOrder}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? "Sending Order..." : "Send to Kitchen"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
