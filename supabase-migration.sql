-- ============================================================================
-- BASQUE MANAGER OS â€” SUPABASE MIGRATION
-- Run this in: Supabase Dashboard â†’ SQL Editor â†’ New query â†’ Paste â†’ Run
-- ============================================================================


-- â”€â”€â”€ 1. SEED DEMO USERS (5 accounts) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO users (id, name, email, password_hash, pin, phone, role, section, is_active, joined_date)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Arjun', 'arjun@basquedehradun.com',
   '$2b$10$DEMO_HASH_MANAGER', NULL, '+919000000002', 'restaurant_manager', NULL, true, '2026-05-28'),
  ('a1000001-0000-0000-0000-000000000002', 'Priya', 'priya@basquedehradun.com',
   NULL, '4455', '+919000000003', 'floor_manager', NULL, true, '2026-05-28'),
  ('a1000001-0000-0000-0000-000000000003', 'Rahul', 'rahul@basquedehradun.com',
   NULL, '1122', '+919000000004', 'server', 'indoor', true, '2026-05-28'),
  ('a1000001-0000-0000-0000-000000000004', 'Kitchen', 'kitchen@basquedehradun.com',
   NULL, '7788', '+919000000005', 'kitchen', NULL, true, '2026-05-28')
ON CONFLICT (id) DO NOTHING;


-- â”€â”€â”€ 2. UPDATE MENU CATEGORIES to match menuData.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
UPDATE menu_categories SET name = 'mango_mania', label = 'Mango Mania' WHERE sort_order = 1;
UPDATE menu_categories SET name = 'soups_salads', label = 'Soups & Salads' WHERE sort_order = 2;
UPDATE menu_categories SET name = 'appetizers', label = 'Appetizers' WHERE sort_order = 3;
UPDATE menu_categories SET name = 'pizza_pasta', label = 'Pizza & Pasta' WHERE sort_order = 4;
UPDATE menu_categories SET name = 'indian_tandoor', label = 'Indian & Tandoor' WHERE sort_order = 5;
-- sort_order = 6 (Cocktails) is already correct


-- â”€â”€â”€ 3. SEED ALL 68 MENU ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM menu_items;

-- Mango Mania (sort_order = 1)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, is_signature, is_new, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, v.dietary::dietary_tag, true, v.is_signature, v.is_new, v.sort_order, 15
FROM menu_categories c
CROSS JOIN (VALUES
  ('Thai Raw Mango Salad', 'Raw mango, chilli, peanuts, coriander', 330, 'veg', false, false, 1),
  ('Mango Paneer Tikka', 'Tandoori paneer, light mango marinade, mint chutney', 510, 'veg', true, true, 2),
  ('Mango Chilli Chicken', 'Crispy chicken, sweet-spicy mango glaze', 570, 'non_veg', false, true, 3),
  ('Mango Burrata Bomb', 'Burrata on mango relish, basil oil, garlic bread', 460, 'veg', true, true, 4),
  ('Thai Yellow Mango Curry Veg', 'Yellow curry, coconut milk & mango', 710, 'veg', false, true, 5),
  ('Thai Yellow Mango Curry Chicken', 'Yellow curry, coconut milk & mango', 780, 'non_veg', false, true, 6),
  ('Thai Yellow Mango Curry Prawn', 'Yellow curry, coconut milk & mango', 850, 'non_veg', false, true, 7),
  ('Mango Cheesecake', 'Creamy cheesecake topped with fresh mango puree', 360, 'veg', true, false, 8),
  ('Mango Tiramisu', 'Mascarpone layered with mango-soaked sponge', 380, 'veg', false, false, 9),
  ('Aam Panna', 'Roasted raw mango, cumin, mint & soda', 260, 'veg', false, false, 10),
  ('Thicc Mango Shake', 'Mango, ice cream, milk', 325, 'veg', false, false, 11),
  ('Mango Lassi', 'Sweet mango, salted yogurt & spice', 295, 'veg', false, false, 12),
  ('Spiked Aam Panna', 'Classic aam panna spiked with vodka', 545, 'veg', false, false, 13),
  ('Mango Pahadi Cooler', 'Mango, mint, gin, green chilli & black salt', 675, 'veg', false, false, 14)
) AS v(name, description, price, dietary, is_signature, is_new, sort_order)
WHERE c.sort_order = 1;

-- Soups & Salads (sort_order = 2)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, v.dietary::dietary_tag, true, v.sort_order, 12
FROM menu_categories c
CROSS JOIN (VALUES
  ('Cream of Mushroom', 'Wild mushrooms, shallots, thyme, cream, truffle oil', 310, 'veg', 1),
  ('Minestrone', 'Mixed vegetables, basil, pasta, tomato broth', 320, 'veg', 2),
  ('Roast Chicken & Herb Veloute', 'Roast chicken, potato puree, herb veloute', 375, 'non_veg', 3),
  ('Mediterranean Salad', 'Hummus, cucumber, olives, onion, tomatoes, lettuce', 350, 'veg', 4),
  ('Mexican Corn Salad', 'Sweet corn, cheese, bell peppers, jalapeno', 310, 'veg', 5),
  ('Quinoa Edamame Salad', 'Quinoa, edamame, cucumber, apple', 410, 'veg', 6),
  ('Caesar Salad Veg', 'Lettuce, dressing, croutons, parmesan', 350, 'veg', 7),
  ('Caesar Salad Chicken', 'Lettuce, dressing, croutons, parmesan', 410, 'non_veg', 8)
) AS v(name, description, price, dietary, sort_order)
WHERE c.sort_order = 2;

-- Appetizers (sort_order = 3)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, v.dietary::dietary_tag, true, v.sort_order, 15
FROM menu_categories c
CROSS JOIN (VALUES
  ('Hummus, Tzatziki & Pita', 'Classic dips with warm pita bread', 325, 'veg', 1),
  ('Pesto Mushrooms', 'Roast mushrooms, pesto, cherry tomatoes, parmesan', 355, 'veg', 2),
  ('Loaded Nachos', 'Tortilla chips, jalapenos, beans, cheese sauce', 375, 'veg', 3),
  ('Cheese Fondue', 'Fondue & garlic-butter croutons', 570, 'veg', 4),
  ('French Fries Salted', 'Classic salted fries', 325, 'veg', 5),
  ('French Fries Peri Peri', 'Peri peri seasoned fries', 345, 'veg', 6),
  ('French Fries Truffle', 'Truffle oil drizzled fries', 365, 'veg', 7),
  ('Basque Fried Chicken', 'Fried chicken, house seasoning', 490, 'non_veg', 8),
  ('Fish Fingers', 'Crumb-fried fish, tartar sauce', 610, 'non_veg', 9),
  ('Butter Garlic Prawns', 'Prawns, garlic butter, smoked paprika', 650, 'non_veg', 10)
) AS v(name, description, price, dietary, sort_order)
WHERE c.sort_order = 3;

-- Pizza & Pasta (sort_order = 4)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, v.dietary::dietary_tag, true, v.sort_order, 20
FROM menu_categories c
CROSS JOIN (VALUES
  ('Margherita Pizza', 'Mozzarella, cherry tomatoes, basil', 655, 'veg', 1),
  ('Fiamma Pizza', 'Onions, jalapeno, sundried tomatoes, mozzarella', 695, 'veg', 2),
  ('Burrata Pizza', 'Burrata, bocconcini, basil', 875, 'veg', 3),
  ('Genovese Pizza', 'Basil pesto, cherry tomatoes, olive oil', 745, 'veg', 4),
  ('Al Funghi Pizza', 'Roasted mushrooms & cheese', 795, 'veg', 5),
  ('Chicken Tikka Pizza', 'Chicken tikka, onion, paprika, mint mayo', 855, 'non_veg', 6),
  ('Pork Pepperoni Pizza', 'Pork pepperoni & cheese', 925, 'non_veg', 7),
  ('Pasta', 'Choice of pasta, sauce and vegetables', 545, 'veg', 8),
  ('Truffle Cream Ravioli', 'Mushroom, cheese ravioli with truffle cream sauce', 695, 'veg', 9),
  ('Baked Lasagna', 'Pasta layers, tomato sauce, bechamel, vegetables, cheese', 665, 'veg', 10)
) AS v(name, description, price, dietary, sort_order)
WHERE c.sort_order = 4;

-- Indian & Tandoor (sort_order = 5)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, is_signature, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, v.dietary::dietary_tag, true, v.is_signature, v.sort_order, 18
FROM menu_categories c
CROSS JOIN (VALUES
  ('Mini Truffle Kulcha', 'Truffle-infused kulcha bread', 345, 'veg', false, 1),
  ('Paneer Khurchan Mini Tacos', 'Spiced paneer in mini taco shells', 365, 'veg', false, 2),
  ('Butter Chicken Fondue', 'Makhani sauce, tandoori chicken, kulcha', 545, 'non_veg', true, 3),
  ('Mini Vada Pav', 'Mumbai-style potato fritters', 285, 'veg', false, 4),
  ('Doon Bun Tikki', 'Dehradun-style street bun tikki', 265, 'veg', false, 5),
  ('Basque Paneer Tikka', 'House-marinated paneer tikka', 455, 'veg', false, 6),
  ('Malai Chicken Tikka Boneless', 'Creamy boneless chicken tikka', 565, 'non_veg', false, 7),
  ('Vegetarian Tandoori Platter', 'Assorted tandoor vegetables', 1299, 'veg', true, 8),
  ('Non-Vegetarian Tandoori Platter', 'Assorted tandoor meats', 1799, 'non_veg', true, 9),
  ('Basque Dal Makhni', 'Slow-cooked black lentils', 645, 'veg', true, 10),
  ('Paneer Lababdar', 'Paneer in rich tomato gravy', 645, 'veg', false, 11),
  ('Basque Classic Butter Chicken', 'Signature butter chicken', 795, 'non_veg', true, 12),
  ('Chicken Biryani', 'Fragrant chicken biryani', 765, 'non_veg', false, 13),
  ('Mutton Biryani', 'Slow-cooked mutton biryani', 865, 'non_veg', false, 14)
) AS v(name, description, price, dietary, is_signature, sort_order)
WHERE c.sort_order = 5;

-- Cocktails (sort_order = 6)
INSERT INTO menu_items (category_id, name, description, price, dietary, is_available, sort_order, preparation_time)
SELECT c.id, v.name, v.description, v.price, 'veg', true, v.sort_order, 8
FROM menu_categories c
CROSS JOIN (VALUES
  ('Rodo Sour', 'Buransh-infused vodka, lime, buransh syrup', 675, 1),
  ('Thyme Trails', 'Gin, lime, thyme-honey syrup, cucumber', 675, 2),
  ('Sacred Grove', 'White rum, lemongrass-tulsi syrup, lime, mint, soda', 675, 3),
  ('Rosewood Calm', 'Vodka, single malt whiskey, saffron syrup, rose milk', 675, 4),
  ('Garden Bloom', 'Gin, lavender, blue pea tea, lime juice', 675, 5),
  ('Caramel Cloud', 'Bourbon whisky, lime, popcorn syrup', 675, 6),
  ('Wild Ember', 'Tequila, mango, coriander, chilli', 675, 7),
  ('Morning in the Garden', 'Vodka, lemon, honey-vanilla syrup, cereal milk foam', 675, 8)
) AS v(name, description, price, sort_order)
WHERE c.sort_order = 6;


-- â”€â”€â”€ 4. ADD pending_approval STATUS TO ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DO $$
BEGIN
  ALTER TYPE order_stage ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'placed';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;


-- â”€â”€â”€ 5. ENABLE REALTIME ON KEY TABLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE waitlist_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE table_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- â”€â”€â”€ 6. ROW LEVEL SECURITY (RLS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Menu items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read menu" ON menu_items;
CREATE POLICY "Anyone can read menu" ON menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert menu" ON menu_items;
CREATE POLICY "Anyone can insert menu" ON menu_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update menu" ON menu_items;
CREATE POLICY "Anyone can update menu" ON menu_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete menu" ON menu_items;
CREATE POLICY "Anyone can delete menu" ON menu_items FOR DELETE USING (true);

-- Menu categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read categories" ON menu_categories;
CREATE POLICY "Anyone can read categories" ON menu_categories FOR SELECT USING (true);

-- Tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read tables" ON tables;
CREATE POLICY "Anyone can read tables" ON tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update tables" ON tables;
CREATE POLICY "Anyone can update tables" ON tables FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can insert tables" ON tables;
CREATE POLICY "Anyone can insert tables" ON tables FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete tables" ON tables;
CREATE POLICY "Anyone can delete tables" ON tables FOR DELETE USING (true);

-- Sections
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read sections" ON sections;
CREATE POLICY "Anyone can read sections" ON sections FOR SELECT USING (true);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Anyone can read orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true);

-- Order items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read order_items" ON order_items;
CREATE POLICY "Anyone can read order_items" ON order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert order_items" ON order_items;
CREATE POLICY "Anyone can insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Service requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read service_requests" ON service_requests;
CREATE POLICY "Anyone can read service_requests" ON service_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert service_requests" ON service_requests;
CREATE POLICY "Anyone can insert service_requests" ON service_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update service_requests" ON service_requests;
CREATE POLICY "Anyone can update service_requests" ON service_requests FOR UPDATE USING (true);

-- Waitlist entries
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read waitlist" ON waitlist_entries;
CREATE POLICY "Anyone can read waitlist" ON waitlist_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON waitlist_entries;
CREATE POLICY "Anyone can insert waitlist" ON waitlist_entries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update waitlist" ON waitlist_entries;
CREATE POLICY "Anyone can update waitlist" ON waitlist_entries FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete waitlist" ON waitlist_entries;
CREATE POLICY "Anyone can delete waitlist" ON waitlist_entries FOR DELETE USING (true);

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reservations" ON reservations;
CREATE POLICY "Anyone can read reservations" ON reservations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert reservations" ON reservations;
CREATE POLICY "Anyone can insert reservations" ON reservations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update reservations" ON reservations;
CREATE POLICY "Anyone can update reservations" ON reservations FOR UPDATE USING (true);

-- Table sessions
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read sessions" ON table_sessions;
CREATE POLICY "Anyone can read sessions" ON table_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert sessions" ON table_sessions;
CREATE POLICY "Anyone can insert sessions" ON table_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update sessions" ON table_sessions;
CREATE POLICY "Anyone can update sessions" ON table_sessions FOR UPDATE USING (true);

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read users" ON users;
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update users" ON users;
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete users" ON users;
CREATE POLICY "Anyone can delete users" ON users FOR DELETE USING (true);

-- Audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read audit" ON audit_logs;
CREATE POLICY "Anyone can read audit" ON audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert audit" ON audit_logs;
CREATE POLICY "Anyone can insert audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- Shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read shifts" ON shifts;
CREATE POLICY "Anyone can read shifts" ON shifts FOR SELECT USING (true);

-- Reservation stage history
ALTER TABLE reservation_stage_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read rsh" ON reservation_stage_history;
CREATE POLICY "Anyone can read rsh" ON reservation_stage_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert rsh" ON reservation_stage_history;
CREATE POLICY "Anyone can insert rsh" ON reservation_stage_history FOR INSERT WITH CHECK (true);


-- â”€â”€â”€ 7. DEMO DATA (Realistic restaurant scenario) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- This creates a "live evening at Basque" state for demo purposes.
-- Can be cleared via the "Reset Demo" button on the login page.

-- 7pre. Clear any existing demo data so this section is fully re-runnable
DELETE FROM order_items WHERE order_id::text LIKE 'e0000001%';
DELETE FROM orders WHERE id::text LIKE 'e0000001%';
DELETE FROM service_requests WHERE id::text LIKE 'f0000001%';
DELETE FROM waitlist_entries WHERE id::text LIKE 'b0000001%';
DELETE FROM reservations WHERE id::text LIKE 'c0000001%';
UPDATE tables SET current_session = NULL WHERE current_session::text LIKE 'd0000001%';
DELETE FROM table_sessions WHERE id::text LIKE 'd0000001%';

-- 7a. Create active table sessions (some tables occupied)
INSERT INTO table_sessions (id, table_id, guest_name, party_size, is_vip, is_active, created_at)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'T1', 'Hemant Dua', 2, true, true, now() - interval '87 minutes'),
  ('d0000001-0000-0000-0000-000000000002', 'T4', 'Sharma Group', 5, false, true, now() - interval '24 minutes'),
  ('d0000001-0000-0000-0000-000000000003', 'T8', 'Mehta Family', 4, true, true, now() - interval '55 minutes'),
  ('d0000001-0000-0000-0000-000000000004', 'T12', 'Kapoor & Co', 4, false, true, now() - interval '10 minutes'),
  ('d0000001-0000-0000-0000-000000000005', 'T13', 'Walk-in Guest', 2, false, true, now() - interval '112 minutes'),
  ('d0000001-0000-0000-0000-000000000006', 'T15', 'Rajput', 2, false, true, now() - interval '45 minutes'),
  ('d0000001-0000-0000-0000-000000000007', 'T17', 'Verma', 4, false, true, now() - interval '15 minutes');

-- 7b. Update table statuses to match sessions
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000001' WHERE id = 'T1';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000002' WHERE id = 'T4';
UPDATE tables SET status = 'needs_bussing' WHERE id = 'T5';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000003' WHERE id = 'T8';
UPDATE tables SET status = 'reserved' WHERE id = 'T10';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000004' WHERE id = 'T12';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000005' WHERE id = 'T13';
UPDATE tables SET status = 'needs_bussing' WHERE id = 'T14';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000006' WHERE id = 'T15';
UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000007' WHERE id = 'T17';

-- 7c. Create demo orders
INSERT INTO orders (id, session_id, stage, subtotal, notes, created_at, placed_at)
VALUES
  ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'placed', 1480, NULL, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 'placed', 3200, 'No nuts', now() - interval '22 minutes', now() - interval '22 minutes'),
  ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000004', 'placed', 2100, NULL, now() - interval '5 minutes', now() - interval '5 minutes'),
  ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000005', 'served', 1750, NULL, now() - interval '40 minutes', now() - interval '40 minutes'),
  ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000006', 'placed', 960, NULL, now() - interval '18 minutes', now() - interval '18 minutes'),
  ('e0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000007', 'placed', 680, NULL, now() - interval '3 minutes', now() - interval '3 minutes');

-- 7d. Order items (referencing real menu_items by name-lookup)
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, special_instructions)
SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Mango Cheesecake'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Aam Panna'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'French Fries Truffle'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000002'::uuid, id, 1, price, 'Well done' FROM menu_items WHERE name = 'Non-Vegetarian Tandoori Platter'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000002'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Sacred Grove'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Butter Garlic Prawns'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Quinoa Edamame Salad'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Garden Bloom'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000004'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Truffle Cream Ravioli'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000004'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Mango Tiramisu'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000005'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Loaded Nachos'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000005'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Thyme Trails'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000006'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'French Fries Truffle'
UNION ALL
SELECT 'e0000001-0000-0000-0000-000000000006'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Aam Panna';

-- 7e. Service requests (waiter calls + bill requests)
INSERT INTO service_requests (id, table_id, table_name, type, status, created_at)
VALUES
  ('f0000001-0000-0000-0000-000000000001', 'T1', 'Table T1', 'call_waiter', 'new', now() - interval '4 minutes'),
  ('f0000001-0000-0000-0000-000000000002', 'T8', 'Table T8', 'bill_request', 'acknowledged', now() - interval '12 minutes'),
  ('f0000001-0000-0000-0000-000000000003', 'T15', 'Table T15', 'call_waiter', 'new', now() - interval '2 minutes');

-- 7f. Waitlist entries
INSERT INTO waitlist_entries (id, guest_name, guest_phone, party_size, source, status, estimated_wait, priority, notes, created_at)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Patel Family', '+919876500001', 4, 'walk_in', 'waiting', 20, 1, 'Prefer garden seating', now() - interval '22 minutes'),
  ('b0000001-0000-0000-0000-000000000002', 'Ms. Ananya', '+919876500002', 2, 'phone', 'waiting', 10, 2, 'VIP guest', now() - interval '10 minutes'),
  ('b0000001-0000-0000-0000-000000000003', 'Gupta Group', '+919876500003', 6, 'website', 'waiting', 30, 3, 'Birthday dinner', now() - interval '35 minutes'),
  ('b0000001-0000-0000-0000-000000000004', 'Mr. Iyer', '+919876500004', 2, 'host_stand', 'waiting', 10, 4, NULL, now() - interval '5 minutes');

-- 7g. Reservation leads (pipeline demo)
INSERT INTO reservations (id, type, stage, name, phone, date, time_slot, guests, source_modal, details, created_at, received_at)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'table', 'new', 'Aditya Khanna', '+919876543210', '2026-06-03', '19:30', 4, 'TableBookingModal', '{"occasion": "Anniversary"}', now() - interval '2 hours', now() - interval '2 hours'),
  ('c0000001-0000-0000-0000-000000000002', 'golf_dining', 'reviewing', 'Riya Malhotra', '+919988776655', '2026-06-04', '12:00', 2, 'GolfDiningModal', '{"package": "afternoon"}', now() - interval '5 hours', now() - interval '5 hours'),
  ('c0000001-0000-0000-0000-000000000003', 'event', 'accepted', 'Nair & Family', '+917000123456', '2026-06-10', '18:00', 30, 'EventEnquiryModal', '{"event_type": "Birthday", "space": "Garden", "budget": "Rs 5-15L"}', now() - interval '24 hours', now() - interval '24 hours'),
  ('c0000001-0000-0000-0000-000000000004', 'golf', 'declined', 'Priyanka Bose', '+918899011223', '2026-06-02', '10:00', 2, 'GolfBookingModal', '{}', now() - interval '10 hours', now() - interval '10 hours'),
  ('c0000001-0000-0000-0000-000000000005', 'table', 'new', 'Suresh Pillai', '+919123456789', '2026-06-02', '20:00', 3, 'TableBookingModal', '{"occasion": "Business Dinner"}', now() - interval '1 hour', now() - interval '1 hour');


-- â”€â”€â”€ 8. CREATE DEMO RESET FUNCTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Called from the "Reset Demo Data" button on login page
CREATE OR REPLACE FUNCTION reset_demo_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Break foreign key references first
  UPDATE tables SET current_session = NULL WHERE id IS NOT NULL;

  -- 2. Clear transactional data
  DELETE FROM order_items WHERE id IS NOT NULL;
  DELETE FROM orders WHERE id IS NOT NULL;
  DELETE FROM service_requests WHERE id IS NOT NULL;
  DELETE FROM waitlist_entries WHERE id IS NOT NULL;
  DELETE FROM table_sessions WHERE id IS NOT NULL;
  DELETE FROM audit_logs WHERE id IS NOT NULL;
  DELETE FROM reservation_stage_history WHERE id IS NOT NULL;

  -- 3. Reset all tables to available
  UPDATE tables SET status = 'available' WHERE id IS NOT NULL;

  -- Delete demo reservations (keep any real ones from website)
  DELETE FROM reservations WHERE id LIKE 'c0000001%';

  -- Re-insert fresh demo data
  INSERT INTO table_sessions (id, table_id, guest_name, party_size, is_vip, is_active, created_at)
  VALUES
    ('d0000001-0000-0000-0000-000000000001', 'T1', 'Hemant Dua', 2, true, true, now() - interval '87 minutes'),
    ('d0000001-0000-0000-0000-000000000002', 'T4', 'Sharma Group', 5, false, true, now() - interval '24 minutes'),
    ('d0000001-0000-0000-0000-000000000003', 'T8', 'Mehta Family', 4, true, true, now() - interval '55 minutes'),
    ('d0000001-0000-0000-0000-000000000004', 'T12', 'Kapoor & Co', 4, false, true, now() - interval '10 minutes'),
    ('d0000001-0000-0000-0000-000000000005', 'T13', 'Walk-in Guest', 2, false, true, now() - interval '112 minutes'),
    ('d0000001-0000-0000-0000-000000000006', 'T15', 'Rajput', 2, false, true, now() - interval '45 minutes'),
    ('d0000001-0000-0000-0000-000000000007', 'T17', 'Verma', 4, false, true, now() - interval '15 minutes');

  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000001' WHERE id = 'T1';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000002' WHERE id = 'T4';
  UPDATE tables SET status = 'needs_bussing' WHERE id = 'T5';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000003' WHERE id = 'T8';
  UPDATE tables SET status = 'reserved' WHERE id = 'T10';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000004' WHERE id = 'T12';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000005' WHERE id = 'T13';
  UPDATE tables SET status = 'needs_bussing' WHERE id = 'T14';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000006' WHERE id = 'T15';
  UPDATE tables SET status = 'seated', current_session = 'd0000001-0000-0000-0000-000000000007' WHERE id = 'T17';

  INSERT INTO orders (id, session_id, stage, subtotal, notes, created_at, placed_at) VALUES
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'placed', 1480, NULL, now() - interval '8 minutes', now() - interval '8 minutes'),
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 'placed', 3200, 'No nuts', now() - interval '22 minutes', now() - interval '22 minutes'),
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000004', 'placed', 2100, NULL, now() - interval '5 minutes', now() - interval '5 minutes'),
    ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000005', 'served', 1750, NULL, now() - interval '40 minutes', now() - interval '40 minutes'),
    ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000006', 'placed', 960, NULL, now() - interval '18 minutes', now() - interval '18 minutes'),
    ('e0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000007', 'placed', 680, NULL, now() - interval '3 minutes', now() - interval '3 minutes');

  INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, special_instructions)
  SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Mango Cheesecake'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Aam Panna'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000001'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'French Fries Truffle'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000002'::uuid, id, 1, price, 'Well done' FROM menu_items WHERE name = 'Non-Vegetarian Tandoori Platter'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000002'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Sacred Grove'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Butter Garlic Prawns'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Quinoa Edamame Salad'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000003'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Garden Bloom'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000004'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Truffle Cream Ravioli'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000004'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'Mango Tiramisu'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000005'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Loaded Nachos'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000005'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Thyme Trails'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000006'::uuid, id, 1, price, NULL FROM menu_items WHERE name = 'French Fries Truffle'
  UNION ALL SELECT 'e0000001-0000-0000-0000-000000000006'::uuid, id, 2, price, NULL FROM menu_items WHERE name = 'Aam Panna';

  INSERT INTO service_requests (id, table_id, table_name, type, status, created_at) VALUES
    ('f0000001-0000-0000-0000-000000000001', 'T1', 'Table T1', 'call_waiter', 'new', now() - interval '4 minutes'),
    ('f0000001-0000-0000-0000-000000000002', 'T8', 'Table T8', 'bill_request', 'acknowledged', now() - interval '12 minutes'),
    ('f0000001-0000-0000-0000-000000000003', 'T15', 'Table T15', 'call_waiter', 'new', now() - interval '2 minutes');

  INSERT INTO waitlist_entries (id, guest_name, guest_phone, party_size, source, status, estimated_wait, priority, notes, created_at) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'Patel Family', '+919876500001', 4, 'walk_in', 'waiting', 20, 1, 'Prefer garden seating', now() - interval '22 minutes'),
    ('b0000001-0000-0000-0000-000000000002', 'Ms. Ananya', '+919876500002', 2, 'phone', 'waiting', 10, 2, 'VIP guest', now() - interval '10 minutes'),
    ('b0000001-0000-0000-0000-000000000003', 'Gupta Group', '+919876500003', 6, 'website', 'waiting', 30, 3, 'Birthday dinner', now() - interval '35 minutes'),
    ('b0000001-0000-0000-0000-000000000004', 'Mr. Iyer', '+919876500004', 2, 'host_stand', 'waiting', 10, 4, NULL, now() - interval '5 minutes');

  INSERT INTO reservations (id, type, stage, name, phone, date, time_slot, guests, source_modal, details, created_at, received_at) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'table', 'new', 'Aditya Khanna', '+919876543210', '2026-06-03', '19:30', 4, 'TableBookingModal', '{"occasion": "Anniversary"}', now() - interval '2 hours', now() - interval '2 hours'),
    ('c0000001-0000-0000-0000-000000000002', 'golf_dining', 'reviewing', 'Riya Malhotra', '+919988776655', '2026-06-04', '12:00', 2, 'GolfDiningModal', '{"package": "afternoon"}', now() - interval '5 hours', now() - interval '5 hours'),
    ('c0000001-0000-0000-0000-000000000003', 'event', 'accepted', 'Nair & Family', '+917000123456', '2026-06-10', '18:00', 30, 'EventEnquiryModal', '{"event_type": "Birthday", "space": "Garden", "budget": "Rs 5-15L"}', now() - interval '24 hours', now() - interval '24 hours'),
    ('c0000001-0000-0000-0000-000000000004', 'golf', 'declined', 'Priyanka Bose', '+918899011223', '2026-06-02', '10:00', 2, 'GolfBookingModal', '{}', now() - interval '10 hours', now() - interval '10 hours'),
    ('c0000001-0000-0000-0000-000000000005', 'table', 'new', 'Suresh Pillai', '+919123456789', '2026-06-02', '20:00', 3, 'TableBookingModal', '{"occasion": "Business Dinner"}', now() - interval '1 hour', now() - interval '1 hour');

END;
$$;


-- â”€â”€â”€ 9. VERIFY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Menu categories: ' || count(*) FROM menu_categories;
SELECT 'Menu items: ' || count(*) FROM menu_items;
SELECT 'Tables: ' || count(*) FROM tables;
SELECT 'Sessions: ' || count(*) FROM table_sessions;
SELECT 'Orders: ' || count(*) FROM orders;
SELECT 'Order items: ' || count(*) FROM order_items;
SELECT 'Service requests: ' || count(*) FROM service_requests;
SELECT 'Waitlist: ' || count(*) FROM waitlist_entries;
SELECT 'Reservations: ' || count(*) FROM reservations;






