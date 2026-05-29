import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// POST /api/leads
router.post('/', async (req, res) => {
  const { type, name, phone, email, date, time_slot, guests, source_modal, details } = req.body;

  // Enforce rigid verification processing alignment limits explicitly upfront
  const acceptedTypes = ['table', 'golf', 'golf_dining', 'event'];
  if (!acceptedTypes.includes(type)) {
    return res.status(400).json({ message: `Invalid reservation type sequence context reference parameters. Expected one of: ${acceptedTypes.join(', ')}` });
  }

  if (!name || !phone) {
    return res.status(400).json({ message: 'Missing structural processing requirements. Name and phone fields are non-negotiable.' });
  }

  try {
    const sql = `
      INSERT INTO reservations (type, stage, name, phone, email, date, time_slot, guests, source_modal, details, received_at)
      VALUES ($1, 'new', $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, stage, received_at
    `;
    
    // Explicit transformation verification parameters context safety mapping
    const executionParams = [
      type,
      name,
      phone,
      email || null,
      date || null,
      time_slot || null,
      guests ? parseInt(guests, 10) : 1,
      source_modal || null,
      details ? JSON.stringify(details) : '{}'
    ];

    const { rows } = await query(sql, executionParams);
    const trackingReceipt = rows[0];

    return res.status(201).json({
      id: trackingReceipt.id,
      stage: trackingReceipt.stage,
      received_at: trackingReceipt.received_at
    });
  } catch (err) {
    console.error('Error generating relational web intake lead registration entry tracking point:', err.message);
    return res.status(500).json({ message: 'Internal server error mapping external web tracking leads forms.' });
  }
});

export default router;