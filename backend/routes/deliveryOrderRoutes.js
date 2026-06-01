import express from 'express';
import prisma from '../lib/prisma.js';
import { checkServiceability, createShipment, getLabelUrl } from '../services/shadowfaxService.js';

const router = express.Router();

// ─── 1. CHECK SERVICEABILITY ─────────────────────────────────────────────
// POST /api/delivery-orders/check-serviceability
router.post('/check-serviceability', async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode) return res.status(400).json({ serviceable: false, reason: "Pincode is required." });
    
    const result = await checkServiceability(pincode);
    res.json(result);
  } catch (error) {
    res.status(500).json({ serviceable: false, reason: error.message });
  }
});

// ─── 2. WEBHOOK (Must be before /:id) ───────────────────────────────────
// POST /api/delivery-orders/webhook
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Shadowfax will retry if we don't send 200, so we always return 200 even if fields are missing.
    if (!payload || !payload.payload || !payload.payload.client_order_number) {
      return res.status(200).send('OK');
    }

    const clientOrderNumber = payload.payload.client_order_number;
    
    const order = await prisma.deliveryOrder.findUnique({
      where: { clientOrderNumber }
    });

    if (!order) return res.status(200).send('OK');

    const shadowfaxStatus = payload.payload.current_status;
    let orderStatus = order.orderStatus;

    // Map Shadowfax status to our internal status
    const statusMap = {
      'ORDER_ACCEPTED': 'confirmed',
      'PICKED_UP': 'dispatched',
      'IN_TRANSIT': 'dispatched',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'UNDELIVERED': 'placed'
    };

    if (statusMap[shadowfaxStatus]) {
      orderStatus = statusMap[shadowfaxStatus];
    }

    const riderName = payload.payload.delivery_executive?.name || null;
    const riderPhone = payload.payload.delivery_executive?.phone || null;

    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: {
        shadowfaxStatus,
        orderStatus,
        shadowfaxRiderName: riderName,
        shadowfaxRiderPhone: riderPhone
      }
    });

    const io = req.app.get('io');
    if (io) io.emit("deliveryOrder:updated", updatedOrder);

    res.status(200).send('OK');
  } catch (error) {
    console.error("Shadowfax Webhook Error:", error);
    res.status(200).send('OK');
  }
});

// ─── 3. CREATE ORDER ─────────────────────────────────────────────────────
// POST /api/delivery-orders
router.post('/', async (req, res) => {
  try {
    const {
      customerName, customerPhone, customerEmail, deliveryAddress,
      deliveryCity, deliveryState, deliveryPincode, items, paymentMethod
    } = req.body;

    // Strict Validation
    if (!customerName || typeof customerName !== 'string') return res.status(400).json({ error: "Valid customerName is required." });
    if (!customerPhone || !/^\d{10}$/.test(customerPhone)) return res.status(400).json({ error: "customerPhone must be exactly 10 digits." });
    if (!deliveryAddress || !deliveryCity || !deliveryState) return res.status(400).json({ error: "deliveryAddress, deliveryCity, and deliveryState are required." });
    if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode)) return res.status(400).json({ error: "deliveryPincode must be exactly 6 digits." });
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "items must be a non-empty array." });

    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || typeof item.qty !== 'number') {
        return res.status(400).json({ error: "Each item must have a valid name, price, and qty." });
      }
    }

    // Calculation Logic
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const deliveryCharge = subtotal >= 1500 ? 0 : 60;
    const total = subtotal + deliveryCharge;
    const clientOrderNumber = "BASQUE-" + Date.now();

    // Create Order in Prisma
    const order = await prisma.deliveryOrder.create({
      data: {
        clientOrderNumber,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryPincode,
        items: JSON.stringify(items),
        subtotal,
        deliveryCharge,
        total,
        paymentMethod: paymentMethod || 'prepaid'
      }
    });

    const io = req.app.get('io');
    if (io) io.emit("deliveryOrder:new", order);

    // Fire-and-forget Shadowfax shipment integration (do not await)
    createShipment(order)
      .then(async (result) => {
        if (result.success) {
          await prisma.deliveryOrder.update({
            where: { id: order.id },
            data: {
              shadowfaxAwb: result.awbNumber,
              isServiceable: true,
              orderStatus: "confirmed"
            }
          });

          // Fetch Label URL asynchronously
          getLabelUrl(result.awbNumber).then(async (labelResult) => {
            if (labelResult.success) {
              await prisma.deliveryOrder.update({
                where: { id: order.id },
                data: { shadowfaxLabelUrl: labelResult.labelUrl }
              });
            }
          });

          if (io) io.emit("deliveryOrder:updated", { id: order.id, orderStatus: "confirmed" });
        } else {
          // Shipment failed at Shadowfax
          await prisma.deliveryOrder.update({
            where: { id: order.id },
            data: { errorLog: result.error, orderStatus: "failed" }
          });
        }
      })
      .catch(async (err) => {
        await prisma.deliveryOrder.update({
          where: { id: order.id },
          data: { errorLog: err.message, orderStatus: "failed" }
        });
      });

    // Return 201 immediately
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 4. GET ALL ORDERS ───────────────────────────────────────────────────
// GET /api/delivery-orders
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.deliveryOrder.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Parse items JSON
    const parsedOrders = orders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));

    res.json(parsedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 5. GET SINGLE ORDER ─────────────────────────────────────────────────
// GET /api/delivery-orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.deliveryOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!order) return res.status(404).json({ error: "Order not found." });

    // Parse items JSON
    const parsedOrder = {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    };

    res.json(parsedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 6. UPDATE ORDER STATUS ──────────────────────────────────────────────
// PUT /api/delivery-orders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id: req.params.id },
      data: { orderStatus: status }
    });

    const io = req.app.get('io');
    if (io) io.emit("deliveryOrder:updated", updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;