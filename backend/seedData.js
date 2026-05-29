import pool from "./db.js";

// Helper to convert frontend category strings into downcase snake slugs
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/&/g, "")
    .replace(/__+/g, "_");
};

// Complete Basque Restaurant Menu Data Array
const menuData = [
  {
    category: "Mango Mania",
    items: [
      { name: "Thai Raw Mango Salad", price: 330, desc: "Raw mango, chilli, peanuts, coriander", dietary: "veg" },
      { name: "Mango Paneer Tikka", price: 510, desc: "Tandoori paneer, light mango marinade, mint chutney", dietary: "veg" },
      { name: "Mango Chilli Chicken", price: 570, desc: "Crispy chicken, sweet-spicy mango glaze", dietary: "non_veg" },
      { name: "Mango Burrata Bomb", price: 460, desc: "Burrata on mango relish, basil oil, garlic bread", dietary: "veg" },
      { name: "Thai Yellow Mango Curry Veg", price: 710, desc: "Yellow curry, coconut milk & mango", dietary: "veg" },
      { name: "Thai Yellow Mango Curry Chicken", price: 780, desc: "Yellow curry, coconut milk & mango", dietary: "non_veg" },
      { name: "Thai Yellow Mango Curry Prawn", price: 850, desc: "Yellow curry, coconut milk & mango", dietary: "non_veg" },
      { name: "Mango Cheesecake", price: 360, desc: "Creamy cheesecake topped with fresh mango puree", dietary: "veg" },
      { name: "Mango Tiramisu", price: 380, desc: "Mascarpone layered with mango-soaked sponge", dietary: "veg" },
      { name: "Aam Panna", price: 260, desc: "Roasted raw mango, cumin, mint & soda", dietary: "veg" },
      { name: "Thicc Mango Shake", price: 325, desc: "Mango, ice cream, milk", dietary: "veg" },
      { name: "Mango Lassi", price: 295, desc: "Sweet mango, salted yogurt & spice", dietary: "veg" },
      { name: "Spiked Aam Panna", price: 545, desc: "Classic aam panna spiked with vodka", dietary: "veg" },
      { name: "Mango Pahadi Cooler", price: 675, desc: "Mango, mint, gin, green chilli & black salt", dietary: "veg" }
    ]
  },
  {
    category: "Soups & Salads",
    items: [
      { name: "Cream of Mushroom", price: 310, desc: "Wild mushrooms, shallots, thyme, cream, truffle oil", dietary: "veg" },
      { name: "Minestrone", price: 320, desc: "Mixed vegetables, basil, pasta, tomato broth", dietary: "veg" },
      { name: "Roast Chicken & Herb Veloute", price: 375, desc: "Roast chicken, potato puree, herb veloute", dietary: "non_veg" },
      { name: "Mediterranean Salad", price: 350, desc: "Hummus, cucumber, olives, onion, tomatoes, lettuce", dietary: "veg" },
      { name: "Mexican Corn Salad", price: 310, desc: "Sweet corn, cheese, bell peppers, jalapeno", dietary: "veg" },
      { name: "Quinoa Edamame Salad", price: 410, desc: "Quinoa, edamame, cucumber, apple", dietary: "veg" },
      { name: "Caesar Salad Veg", price: 350, desc: "Lettuce, dressing, croutons, parmesan", dietary: "veg" },
      { name: "Caesar Salad Chicken", price: 410, desc: "Lettuce, dressing, croutons, parmesan", dietary: "non_veg" }
    ]
  },
  {
    category: "Appetizers",
    items: [
      { name: "Hummus, Tzatziki & Pita", price: 325, desc: "", dietary: "veg" },
      { name: "Pesto Mushrooms", price: 355, desc: "Roast mushrooms, pesto, cherry tomatoes, parmesan", dietary: "veg" },
      { name: "Loaded Nachos", price: 375, desc: "Tortilla chips, jalapenos, beans, cheese sauce", dietary: "veg" },
      { name: "Cheese Fondue", price: 570, desc: "Fondue & garlic-butter croutons", dietary: "veg" },
      { name: "French Fries Salted", price: 325, desc: "", dietary: "veg" },
      { name: "French Fries Peri Peri", price: 345, desc: "", dietary: "veg" },
      { name: "French Fries Truffle", price: 365, desc: "", dietary: "veg" },
      { name: "Basque Fried Chicken", price: 490, desc: "Fried chicken, house seasoning", dietary: "non_veg" },
      { name: "Fish Fingers", price: 610, desc: "Crumb-fried fish, tartar sauce", dietary: "non_veg" },
      { name: "Butter Garlic Prawns", price: 650, desc: "Prawns, garlic butter, smoked paprika", dietary: "non_veg" }
    ]
  },
  {
    category: "Pizza & Pasta",
    items: [
      { name: "Margherita Pizza", price: 655, desc: "Mozzarella, cherry tomatoes, basil", dietary: "veg" },
      { name: "Fiamma Pizza", price: 695, desc: "Onions, jalapeno, sundried tomatoes, mozzarella", dietary: "veg" },
      { name: "Burrata Pizza", price: 875, desc: "Burrata, bocconcini, basil", dietary: "veg" },
      { name: "Genovese Pizza", price: 745, desc: "Basil pesto, cherry tomatoes, olive oil", dietary: "veg" },
      { name: "Al Funghi Pizza", price: 795, desc: "Roasted mushrooms & cheese", dietary: "veg" },
      { name: "Chicken Tikka Pizza", price: 855, desc: "Chicken tikka, onion, paprika, mint mayo", dietary: "non_veg" },
      { name: "Pork Pepperoni Pizza", price: 925, desc: "Pork pepperoni & cheese", dietary: "non_veg" },
      { name: "Pasta", price: 545, desc: "Choice of pasta, sauce and vegetables", dietary: "veg" },
      { name: "Truffle Cream Ravioli", price: 695, desc: "Mushroom, cheese ravioli with truffle cream sauce", dietary: "veg" },
      { name: "Baked Lasagna", price: 665, desc: "Pasta layers, tomato sauce, bechamel, vegetables, cheese", dietary: "veg" }
    ]
  },
  {
    category: "Indian & Tandoor",
    items: [
      { name: "Mini Truffle Kulcha", price: 345, desc: "", dietary: "veg" },
      { name: "Paneer Khurchan Mini Tacos", price: 365, desc: "", dietary: "veg" },
      { name: "Butter Chicken Fondue", price: 545, desc: "Makhani sauce, tandoori chicken, kulcha", dietary: "non_veg" },
      { name: "Mini Vada Pav", price: 285, desc: "", dietary: "veg" },
      { name: "Doon Bun Tikki", price: 265, desc: "", dietary: "veg" },
      { name: "Basque Paneer Tikka", price: 455, desc: "", dietary: "veg" },
      { name: "Malai Chicken Tikka Boneless", price: 565, desc: "", dietary: "non_veg" },
      { name: "Vegetarian Tandoori Platter", price: 1299, desc: "", dietary: "veg" },
      { name: "Non-Vegetarian Tandoori Platter", price: 1799, desc: "", dietary: "non_veg" },
      { name: "Basque Dal Makhni", price: 645, desc: "", dietary: "veg" },
      { name: "Paneer Lababdar", price: 645, desc: "", dietary: "veg" },
      { name: "Basque Classic Butter Chicken", price: 795, desc: "", dietary: "non_veg" },
      { name: "Chicken Biryani", price: 765, desc: "", dietary: "non_veg" },
      { name: "Mutton Biryani", price: 865, desc: "", dietary: "non_veg" }
    ]
  },
  {
    category: "Cocktails",
    items: [
      { name: "Rodo Sour", price: 675, desc: "Buransh-infused vodka, lime, buransh syrup", dietary: "veg" },
      { name: "Thyme Trails", price: 675, desc: "Gin, lime, thyme-honey syrup, cucumber", dietary: "veg" },
      { name: "Sacred Grove", price: 675, desc: "White rum, lemongrass-tulsi syrup, lime, mint, soda", dietary: "veg" },
      { name: "Rosewood Calm", price: 675, desc: "Vodka, single malt whiskey, saffron syrup, rose milk", dietary: "veg" },
      { name: "Garden Bloom", price: 675, desc: "Gin, lavender, blue pea tea, lime juice", dietary: "veg" },
      { name: "Caramel Cloud", price: 675, desc: "Bourbon whisky, lime, popcorn syrup", dietary: "veg" },
      { name: "Wild Ember", price: 675, desc: "Tequila, mango, coriander, chilli", dietary: "veg" },
      { name: "Morning in the Garden", price: 675, desc: "Vodka, lemon, honey-vanilla syrup, cereal milk foam", dietary: "veg" }
    ]
  }
];

const seedData = async () => {
  try {
    console.log("Verifying connection and preparing menu seed routine...");
    
    // 1. Flush any old records to start with a clean dataset (simulating drop)
    await pool.query("TRUNCATE TABLE order_items, orders, menu_items CASCADE;");
    console.log("Cleaned out legacy items successfully.");

    let globalCategoryOrder = 1;

    for (const section of menuData) {
      const categorySlug = slugify(section.category);

      // 2. Upsert menu category to resolve mismatches safely
      const categorySql = `
        INSERT INTO menu_categories (name, label, sort_order, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (name) 
        DO UPDATE SET label = EXCLUDED.label
        RETURNING id;
      `;
      const catResult = await pool.query(categorySql, [categorySlug, section.category, globalCategoryOrder++]);
      const categoryId = catResult.rows[0].id;
      
      console.log(`Registered Category: "${section.category}" (${categoryId})`);

      let itemSortOrder = 1;
      for (const item of section.items) {
        // Convert to intermediate integer paise storage value (* 100)
        const paisePrice = Math.round(item.price * 100);

        // 3. Inject menu_items linking back to resolved Category UUID
        const itemSql = `
          INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, sort_order)
          VALUES ($1, $2, $3, $4, $5, true, $6)
          ON CONFLICT DO NOTHING;
        `;
        
        await pool.query(itemSql, [
          categoryId,
          item.name,
          item.desc || null,
          paisePrice,
          item.dietary || "veg",
          itemSortOrder++
        ]);
      }
      console.log(` -> Synced ${section.items.length} items under "${section.category}"`);
    }

    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Critical crash during script initialization logic:", error);
    process.exit(1);
  }
};

seedData();