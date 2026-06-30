import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import "./RestaurantSetup.css";

const DIETARY_LABELS = {
  veg: "Veg 🟢",
  non_veg: "Non-Veg 🔴",
  egg: "Egg 🥚"
};

export default function RestaurantSetup() {
  const [activeTab, setActiveTab] = useState("tables"); // "tables" or "menu"
  const [loading, setLoading] = useState(true);

  // Lists
  const [tables, setTables] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Table form state
  const [newTableId, setNewTableId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [tableSortOrder, setTableSortOrder] = useState("");
  const [tableSubmitting, setTableSubmitting] = useState(false);

  // Table edit state
  const [editingTableId, setEditingTableId] = useState(null);
  const [editCapacity, setEditCapacity] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");
  const [tableUpdating, setTableUpdating] = useState(false);

  // Menu form state
  const [dishName, setDishName] = useState("");
  const [dishDesc, setDishDesc] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishDietary, setDishDietary] = useState("veg");
  const [dishPrepTime, setDishPrepTime] = useState("15");
  const [dishImageUrl, setDishImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dishIsSignature, setDishIsSignature] = useState(false);
  const [dishIsNew, setDishIsNew] = useState(false);
  const [menuSubmitting, setMenuSubmitting] = useState(false);

  // Category form state
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Price edits temporary states (itemId -> price string)
  const [priceEdits, setPriceEdits] = useState({});

  // Loading functions
  const loadTablesAndSections = useCallback(async () => {
    try {
      const [tablesRes, sectionsRes] = await Promise.all([
        supabase.from("tables").select("*, sections(id, name, label)").order("id"),
        supabase.from("sections").select("*").order("sort_order")
      ]);

      if (tablesRes.error) throw tablesRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      setTables(tablesRes.data || []);
      setSections(sectionsRes.data || []);
      
      if (sectionsRes.data?.length > 0 && !selectedSectionId) {
        setSelectedSectionId(sectionsRes.data[0].id);
      }
    } catch (err) {
      console.error("Error loading tables/sections:", err);
      toast.error("Failed to load tables.");
    }
  }, [selectedSectionId]);

  const loadMenuAndCategories = useCallback(async () => {
    try {
      const [categoriesRes, menuRes] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("menu_items").select("*, menu_categories(id, name, label)").order("sort_order")
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (menuRes.error) throw menuRes.error;

      setCategories(categoriesRes.data || []);
      setMenuItems(menuRes.data || []);
      
      if (categoriesRes.data?.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesRes.data[0].id);
      }
    } catch (err) {
      console.error("Error loading menu/categories:", err);
      toast.error("Failed to load menu items.");
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (activeTab === "tables") {
        await loadTablesAndSections();
      } else {
        await loadMenuAndCategories();
      }
      setLoading(false);
    };
    init();
  }, [activeTab, loadTablesAndSections, loadMenuAndCategories]);

  // Add Table
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableId.trim()) {
      toast.error("Please enter a Table ID.");
      return;
    }
    if (!selectedSectionId) {
      toast.error("Please select a Section.");
      return;
    }

    setTableSubmitting(true);
    try {
      const tid = newTableId.trim().toUpperCase();

      // Check if table ID already exists
      const { data: existing } = await supabase
        .from("tables")
        .select("id")
        .eq("id", tid)
        .maybeSingle();

      if (existing) {
        toast.error(`Table ${tid} already exists.`);
        setTableSubmitting(false);
        return;
      }

      const orderVal = parseInt(tableSortOrder) || (tables.length + 1);

      const { error } = await supabase.from("tables").insert([{
        id: tid,
        section_id: selectedSectionId,
        capacity: parseInt(tableCapacity) || 4,
        status: "available",
        sort_order: orderVal,
        is_active: true
      }]);

      if (error) throw error;

      toast.success(`Table ${tid} added successfully.`);
      setNewTableId("");
      setTableSortOrder("");
      loadTablesAndSections();
    } catch (err) {
      console.error("Error adding table:", err);
      toast.error(err.message || "Failed to add table.");
    } finally {
      setTableSubmitting(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId) => {
    const tableObj = tables.find(t => t.id === tableId);
    if (tableObj && tableObj.status !== "available") {
      toast.error(`Table ${tableId} is currently ${tableObj.status.replace("_", " ")} and cannot be deleted.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Table ${tableId}?`)) return;

    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;

      toast.success(`Table ${tableId} removed.`);
      setTables(prev => prev.filter(t => t.id !== tableId));
    } catch (err) {
      console.error("Error deleting table:", err);
      toast.error("Failed to delete table.");
    }
  };

  // Start editing table
  const handleStartEditTable = (table) => {
    setEditingTableId(table.id);
    setEditCapacity(String(table.capacity));
    setEditSectionId(table.section_id);
    setEditSortOrder(String(table.sort_order || ""));
  };

  // Update Table
  const handleUpdateTable = async (tableId) => {
    if (!editSectionId) {
      toast.error("Please select a Section.");
      return;
    }
    setTableUpdating(true);
    try {
      const { error } = await supabase
        .from("tables")
        .update({
          section_id: editSectionId,
          capacity: parseInt(editCapacity) || 4,
          sort_order: parseInt(editSortOrder) || 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", tableId);

      if (error) throw error;

      toast.success(`Table ${tableId} updated successfully.`);
      setEditingTableId(null);
      await loadTablesAndSections();
    } catch (err) {
      console.error("Error updating table:", err);
      toast.error(err.message || "Failed to update table.");
    } finally {
      setTableUpdating(false);
    }
  };

  // Handle local image file selector
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    setCategorySubmitting(true);
    try {
      const name = newCategoryLabel.trim().toLowerCase().replace(/\s+/g, "_");
      const sortOrder = categories.length + 1;

      const { data, error } = await supabase
        .from("menu_categories")
        .insert([
          {
            name,
            label: newCategoryLabel.trim(),
            sort_order: sortOrder,
            is_active: true
          }
        ])
        .select();

      if (error) throw error;

      toast.success("Category added successfully!");
      setNewCategoryLabel("");
      
      // Reload categories list
      await loadMenuAndCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      toast.error(err.message || "Failed to add category.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Toggle Menu Item Availability
  const handleToggleAvailability = async (id, currentAvailable) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentAvailable, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Dish marked ${!currentAvailable ? "available" : "unavailable"}`);
      
      setMenuItems(prev => 
        prev.map(item => item.id === id ? { ...item, is_available: !currentAvailable } : item)
      );
    } catch (err) {
      console.error("Error toggling availability:", err);
      toast.error("Failed to update availability.");
    }
  };

  // Toggle Section Active Status
  const handleToggleSectionActive = async (id, currentActive) => {
    try {
      const { error } = await supabase
        .from("sections")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Section marked ${!currentActive ? "active" : "closed"}`);
      
      setSections(prev => 
        prev.map(sec => sec.id === id ? { ...sec, is_active: !currentActive } : sec)
      );
    } catch (err) {
      console.error("Error toggling section status:", err);
      toast.error("Failed to update section status.");
    }
  };

  // Reset menu form
  const resetMenuForm = () => {
    setDishName("");
    setDishDesc("");
    setDishPrice("");
    setDishDietary("veg");
    setDishPrepTime("15");
    setDishImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setDishIsSignature(false);
    setDishIsNew(false);
  };

  // Add Dish
  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) {
      toast.error("Please enter a dish name.");
      return;
    }
    if (!dishPrice || parseFloat(dishPrice) <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Please select a category.");
      return;
    }

    setMenuSubmitting(true);

    const performInsert = async (imgUrl) => {
      try {
        const orderVal = menuItems.filter(item => item.category_id === selectedCategoryId).length + 1;

        const newDish = {
          category_id: selectedCategoryId,
          name: dishName.trim(),
          description: dishDesc.trim(),
          price: parseInt(dishPrice),
          dietary: dishDietary,
          image_url: imgUrl || null,
          is_available: true,
          is_signature: dishIsSignature,
          is_new: dishIsNew,
          sort_order: orderVal,
          preparation_time: parseInt(dishPrepTime) || 15
        };

        const { error } = await supabase.from("menu_items").insert([newDish]);

        if (error) throw error;

        toast.success(`Dish "${dishName}" added successfully.`);
        resetMenuForm();
        loadMenuAndCategories();
      } catch (err) {
        console.error("Error adding dish:", err);
        toast.error(err.message || "Failed to add dish.");
      } finally {
        setMenuSubmitting(false);
      }
    };

    // If local image is selected, use base64 preview string as image_url
    if (imagePreview) {
      performInsert(imagePreview);
    } else {
      performInsert(dishImageUrl.trim());
    }
  };

  // Delete Dish
  const handleDeleteDish = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`"${name}" removed from the menu.`);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting dish:", err);
      toast.error("Failed to delete dish.");
    }
  };

  // Update Price
  const handleUpdatePrice = async (itemId, originalName) => {
    const newPriceVal = priceEdits[itemId];
    if (!newPriceVal || isNaN(newPriceVal) || parseFloat(newPriceVal) <= 0) {
      toast.error("Please enter a valid price greater than 0.");
      return;
    }

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ price: parseInt(newPriceVal), updated_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(`Price of "${originalName}" updated to ₹${newPriceVal}.`);
      
      // Update local state
      setMenuItems(prev => 
        prev.map(item => item.id === itemId ? { ...item, price: parseInt(newPriceVal) } : item)
      );

      // Clear priceEdits state for this item
      setPriceEdits(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    } catch (err) {
      console.error("Error updating price:", err);
      toast.error("Failed to update price.");
    }
  };

  const menuItemsByCategory = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      items: menuItems.filter(item => item.category_id === cat.id)
    }));
  }, [categories, menuItems]);

  return (
    <div className="setupConsole">
      <div className="setupHeader">
        <div className="setupTitleWrap">
          <h2>Restaurant Setup</h2>
          <p>Add and configure floor layout tables, or manipulate the restaurant menu card.</p>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="setupTabsRow">
        <button 
          className={`setupTabBtn ${activeTab === "tables" ? "active" : ""}`}
          onClick={() => setActiveTab("tables")}
        >
          Tables Configuration
        </button>
        <button 
          className={`setupTabBtn ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu Management
        </button>
      </div>

      {activeTab === "tables" ? (
        <div className="setupSplitLayout">
          {/* Form Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
            {/* Add Table Form */}
            <div className="setupFormCard">
            <h3>Add New Table</h3>
            <form onSubmit={handleAddTable} className="setupForm">
              <div className="formField">
                <label htmlFor="tableIdInput">Table Number / ID</label>
                <input 
                  id="tableIdInput"
                  type="text" 
                  className="formInput"
                  placeholder="e.g. T19"
                  value={newTableId}
                  onChange={e => setNewTableId(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>

              <div className="formField">
                <label htmlFor="tableSectionSelect">Section Load</label>
                <select 
                  id="tableSectionSelect"
                  className="formSelect"
                  value={selectedSectionId}
                  onChange={e => setSelectedSectionId(e.target.value)}
                  required
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.label}</option>
                  ))}
                </select>
              </div>

              <div className="formField">
                <label htmlFor="tableCapacitySelect">Max Capacity (Covers)</label>
                <select 
                  id="tableCapacitySelect"
                  className="formSelect"
                  value={tableCapacity}
                  onChange={e => setTableCapacity(e.target.value)}
                >
                  <option value="2">2 Pax</option>
                  <option value="4">4 Pax</option>
                  <option value="6">6 Pax</option>
                  <option value="8">8 Pax</option>
                  <option value="12">12 Pax</option>
                </select>
              </div>

              <div className="formField">
                <label htmlFor="tableSortInput">Sort Order</label>
                <input 
                  id="tableSortInput"
                  type="number" 
                  className="formInput"
                  placeholder="e.g. 19"
                  value={tableSortOrder}
                  onChange={e => setTableSortOrder(e.target.value)}
                />
                <span className="formFieldHint">Optional. Higher numbers display later.</span>
              </div>

              <button type="submit" className="btnPrimary" style={{ marginTop: "1rem" }} disabled={tableSubmitting}>
                {tableSubmitting ? "Adding Table..." : "Add Table"}
              </button>
            </form>
          </div>

          {/* Section Management Card */}
          <div className="setupFormCard">
            <h3>Section Management</h3>
            <div className="setupForm">
              {sections.map(sec => (
                <div key={sec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(200, 133, 42, 0.1)" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--charcoal)", fontWeight: "500" }}>{sec.label}</span>
                  <button
                    type="button"
                    className={`btnAction ${sec.is_active !== false ? "available" : "unavailable"}`}
                    onClick={() => handleToggleSectionActive(sec.id, sec.is_active !== false)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: sec.is_active !== false ? "rgba(72, 176, 118, 0.15)" : "rgba(192, 64, 64, 0.15)",
                      color: sec.is_active !== false ? "#48b076" : "#ffb0b0",
                      border: sec.is_active !== false ? "1px solid rgba(72, 176, 118, 0.3)" : "1px solid rgba(192, 64, 64, 0.3)",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {sec.is_active !== false ? "● Active" : "○ Closed"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables List */}
          <div className="setupListCard">
            <div className="setupListHeader">
              <h3>Active Layout Tables ({tables.length})</h3>
            </div>

            {loading ? (
              <p style={{ color: "#8C7B6A", textAlign: "center", padding: "2rem" }}>Loading tables...</p>
            ) : tables.length === 0 ? (
              <p style={{ color: "#8C7B6A", textAlign: "center", padding: "2rem" }}>No tables found.</p>
            ) : (
              <div className="setupTablesGrid">
                {tables.map(table => {
                  const isEditing = editingTableId === table.id;
                  return (
                    <div key={table.id} className="setupTableItem">
                      {isEditing ? (
                        <>
                          <div className="setupTableHead">
                            <strong className="setupTableNum">{table.id}</strong>
                            <span className={`setupStatusPill setupStatus-${table.status}`}>
                              {table.status.replace("_", " ")}
                            </span>
                          </div>
                          
                          <div className="setupTableEditFields">
                            <div className="setupTableEditField">
                              <label>Capacity</label>
                              <select 
                                className="formSelect" 
                                value={editCapacity}
                                onChange={e => setEditCapacity(e.target.value)}
                              >
                                <option value="2">2 Pax</option>
                                <option value="4">4 Pax</option>
                                <option value="6">6 Pax</option>
                                <option value="8">8 Pax</option>
                                <option value="12">12 Pax</option>
                              </select>
                            </div>
                            
                            <div className="setupTableEditField">
                              <label>Section</label>
                              <select 
                                className="formSelect" 
                                value={editSectionId}
                                onChange={e => setEditSectionId(e.target.value)}
                              >
                                {sections.map(sec => (
                                  <option key={sec.id} value={sec.id}>{sec.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="setupTableEditField">
                              <label>Sort Order</label>
                              <input 
                                type="number"
                                className="formInput"
                                value={editSortOrder}
                                onChange={e => setEditSortOrder(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="setupTableFoot" style={{ gap: "0.3rem" }}>
                            <button 
                              className="btnAction save" 
                              onClick={() => handleUpdateTable(table.id)}
                              disabled={tableUpdating}
                              style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem", background: "var(--amber)", color: "white", border: "none" }}
                            >
                              {tableUpdating ? "..." : "Save"}
                            </button>
                            <button 
                              className="btnAction cancel" 
                              onClick={() => setEditingTableId(null)}
                              style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem", background: "#8C7B6A", color: "white", border: "none" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="setupTableHead">
                            <strong className="setupTableNum">{table.id}</strong>
                            <span className={`setupStatusPill setupStatus-${table.status}`}>
                              {table.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="setupTableCap">
                            {table.capacity} Pax Capacity
                          </div>
                          <div className="setupTableFoot">
                            <span className="setupTableSec">{table.sections?.label || "Section"}</span>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button 
                                className="btnAction edit"
                                onClick={() => handleStartEditTable(table)}
                                style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem", background: "rgba(200, 133, 42, 0.08)", color: "var(--amber)", border: "1px solid rgba(200, 133, 42, 0.2)" }}
                              >
                                ✎ Edit
                              </button>
                              <button 
                                className="btnAction delete"
                                onClick={() => handleDeleteTable(table.id)}
                                style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }}
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="setupSplitLayout">
          {/* Form Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
            {/* Add Dish Form */}
            <div className="setupFormCard">
            <h3>Add New Dish</h3>
            <form onSubmit={handleAddDish} className="setupForm">
              <div className="formField">
                <label htmlFor="dishNameInput">Dish / Item Name</label>
                <input 
                  id="dishNameInput"
                  type="text" 
                  className="formInput"
                  placeholder="e.g. Buransh Mojito"
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  required
                />
              </div>

              <div className="formField">
                <label htmlFor="dishDescInput">Description</label>
                <textarea 
                  id="dishDescInput"
                  className="formInput"
                  style={{ minHeight: "70px", resize: "vertical" }}
                  placeholder="Ingredients and serving details..."
                  value={dishDesc}
                  onChange={e => setDishDesc(e.target.value)}
                />
              </div>

              <div className="formField">
                <label htmlFor="dishCategorySelect">Menu Category</label>
                <select 
                  id="dishCategorySelect"
                  className="formSelect"
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="formField">
                <label htmlFor="dishPriceInput">Price (INR)</label>
                <input 
                  id="dishPriceInput"
                  type="number" 
                  className="formInput"
                  placeholder="₹"
                  value={dishPrice}
                  onChange={e => setDishPrice(e.target.value)}
                  required
                />
              </div>

              <div className="formField">
                <label htmlFor="dishDietarySelect">Dietary Profile</label>
                <select 
                  id="dishDietarySelect"
                  className="formSelect"
                  value={dishDietary}
                  onChange={e => setDishDietary(e.target.value)}
                >
                  <option value="veg">Veg 🟢</option>
                  <option value="non_veg">Non-Veg 🔴</option>
                  <option value="egg">Egg 🥚</option>
                </select>
              </div>

              <div className="formField">
                <label htmlFor="dishPrepTimeInput">Preparation Time (mins)</label>
                <input 
                  id="dishPrepTimeInput"
                  type="number" 
                  className="formInput"
                  value={dishPrepTime}
                  onChange={e => setDishPrepTime(e.target.value)}
                />
              </div>

              {/* Space for adding image of the dish */}
              <div className="formField">
                <label>Dish Image</label>
                {imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={imagePreview} alt="Preview" className="previewThumb" />
                    <button 
                      type="button" 
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(192, 64, 64, 0.9)", color: "white", padding: "0.2rem 0.4rem", borderRadius: "2px", fontSize: "0.72rem" }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <label className="imageUploadWrap">
                    <span className="uploadIcon">📷</span>
                    <span className="uploadLabel">Upload Dish Image File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                
                <span style={{ fontSize: "0.72rem", color: "#8C7B6A", textAlign: "center", margin: "0.4rem 0" }}>— OR PASTE IMAGE URL —</span>
                
                <input 
                  type="text" 
                  className="formInput"
                  placeholder="https://example.com/dish-image.jpg"
                  value={dishImageUrl}
                  onChange={e => setDishImageUrl(e.target.value)}
                  disabled={!!imagePreview}
                />
              </div>

              <div style={{ display: "flex", gap: "1.2rem", margin: "0.4rem 0" }}>
                <label className="checkboxLabel" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--charcoal)", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={dishIsSignature} 
                    onChange={e => setDishIsSignature(e.target.checked)}
                  />
                  Signature Special
                </label>

                <label className="checkboxLabel" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--charcoal)", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={dishIsNew} 
                    onChange={e => setDishIsNew(e.target.checked)}
                  />
                  New Arrival
                </label>
              </div>

              <button type="submit" className="btnPrimary" style={{ marginTop: "0.6rem" }} disabled={menuSubmitting}>
                {menuSubmitting ? "Saving Dish..." : "Save Dish"}
              </button>
            </form>
          </div>

          {/* Add Category Card */}
          <div className="setupFormCard">
            <h3>Add New Category</h3>
            <form onSubmit={handleAddCategory} className="setupForm">
              <div className="formField">
                <label htmlFor="categoryLabelInput">Category Name</label>
                <input 
                  id="categoryLabelInput"
                  type="text" 
                  className="formInput"
                  placeholder="e.g. Desserts"
                  value={newCategoryLabel}
                  onChange={e => setNewCategoryLabel(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btnPrimary" style={{ marginTop: "0.6rem" }} disabled={categorySubmitting}>
                {categorySubmitting ? "Adding..." : "Add Category"}
              </button>
            </form>
          </div>
        </div>

        {/* Menu Items List */}
          <div className="setupListCard">
            <div className="setupListHeader">
              <h3>Active Menu Cards</h3>
            </div>

            {loading ? (
              <p style={{ color: "#8C7B6A", textAlign: "center", padding: "2rem" }}>Loading Menu Cards...</p>
            ) : menuItemsByCategory.length === 0 ? (
              <p style={{ color: "#8C7B6A", textAlign: "center", padding: "2rem" }}>No menu items found.</p>
            ) : (
              <div className="setupMenuCategories">
                {menuItemsByCategory.map(cat => cat.items?.length > 0 && (
                  <div key={cat.id} className="setupCategoryBlock">
                    <h4>{cat.label} ({cat.items.length})</h4>
                    <div className="setupMenuItemsGrid">
                      {cat.items.map(item => (
                        <div key={item.id} className={`setupMenuItemCard ${item.is_available === false ? "card-unavailable" : ""}`}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="setupMenuItemImg" />
                          ) : (
                            <div className="setupMenuItemNoImg">
                              <span>No Image Loaded</span>
                            </div>
                          )}

                          <div className="setupMenuItemBody">
                            <div className="setupMenuItemHead">
                              <strong className="setupMenuItemName">{item.name}</strong>
                              <span style={{ fontSize: "0.72rem", color: "#8C7B6A" }}>
                                {DIETARY_LABELS[item.dietary] || item.dietary}
                              </span>
                            </div>
                            
                            <p className="setupMenuItemDesc">
                              {item.description || "No description provided."}
                            </p>

                            <div className="setupMenuItemFoot">
                              {/* Price inline editor */}
                              <div className="priceEditGroup">
                                <span className="priceEditSign">₹</span>
                                <input 
                                  type="text" 
                                  className="priceEditInput"
                                  value={priceEdits[item.id] !== undefined ? priceEdits[item.id] : item.price}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setPriceEdits(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                />
                                {priceEdits[item.id] !== undefined && priceEdits[item.id] !== String(item.price) && (
                                  <button 
                                    className="btnPriceSave"
                                    onClick={() => handleUpdatePrice(item.id, item.name)}
                                    title="Save Price"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>

                              {/* Availability Toggle */}
                              <button 
                                className={`btnAction ${item.is_available !== false ? "available" : "unavailable"}`}
                                onClick={() => handleToggleAvailability(item.id, item.is_available !== false)}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  fontSize: "0.75rem",
                                  background: item.is_available !== false ? "rgba(72, 176, 118, 0.15)" : "rgba(192, 64, 64, 0.15)",
                                  color: item.is_available !== false ? "#48b076" : "#ffb0b0",
                                  border: item.is_available !== false ? "1px solid rgba(72, 176, 118, 0.3)" : "1px solid rgba(192, 64, 64, 0.3)",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  marginRight: "auto"
                                }}
                              >
                                {item.is_available !== false ? "● Active" : "○ Unavailable"}
                              </button>

                              <button 
                                className="btnAction delete"
                                onClick={() => handleDeleteDish(item.id, item.name)}
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                ✕ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
