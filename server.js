import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let tables = [
  { id: 'T1',  section: 'Indoor',  pax: 2, status: 'seated',       guest: 'Hemant Dua',   seatedDuration: 87,  isVip: true },
  { id: 'T2',  section: 'Indoor',  pax: 3, status: 'available' },
  { id: 'T3',  section: 'Indoor',  pax: 4, status: 'available' },
  { id: 'T4',  section: 'Indoor',  pax: 5, status: 'seated',       guest: 'Sharma Group', seatedDuration: 24,  reservation: '21:00' },
  { id: 'T5',  section: 'Indoor',  pax: 2, status: 'needs_bussing' },
  { id: 'T6',  section: 'Indoor',  pax: 3, status: 'available' },
  { id: 'T7',  section: 'Indoor',  pax: 4, status: 'available' },
  { id: 'T8',  section: 'Terrace', pax: 5, status: 'reserved',     guest: 'Mehta Family', reservation: '19:30', isVip: true },
  { id: 'T9',  section: 'Terrace', pax: 2, status: 'available' },
  { id: 'T10', section: 'Terrace', pax: 3, status: 'available' },
  { id: 'T11', section: 'Terrace', pax: 4, status: 'available' },
  { id: 'T12', section: 'Garden',  pax: 5, status: 'available' },
  { id: 'T13', section: 'Garden',  pax: 2, status: 'seated',       guest: 'Walk-in',      seatedDuration: 112 },
  { id: 'T14', section: 'Garden',  pax: 3, status: 'available' },
  { id: 'T15', section: 'Bar',     pax: 4, status: 'available' },
  { id: 'T16', section: 'Bar',     pax: 5, status: 'available' },
  { id: 'T17', section: 'Bar',     pax: 2, status: 'available' },
  { id: 'T18', section: 'Bar',     pax: 3, status: 'available' },
];

let waitlist = [
  { id: 1, name: 'Kapoor Party', party: 4, waitTime: 15 },
  { id: 2, name: 'Singh Family', party: 2, waitTime: 8 },
];

const getStats = () => {
  const seatedTables  = tables.filter(t => t.status === 'seated');
  const available     = tables.filter(t => t.status === 'available').length;
  const seated        = seatedTables.length;
  const avgDuration   = seated
    ? Math.round(seatedTables.reduce((s, t) => s + (t.seatedDuration || 0), 0) / seated)
    : 0;
  const activeCovers  = seatedTables.reduce((s, t) => s + t.pax, 0);
  const revenue       = 26600;
  const avgSpend      = activeCovers > 0 ? Math.round(revenue / activeCovers) : 0;
  return { available, seated, avgDuration, revenue, avgSpend, waitlist: waitlist.length, activeCovers, overTurnTime: 0 };
};

app.get('/api/tables',  (req, res) => res.json(tables));
app.get('/api/stats',   (req, res) => res.json(getStats()));
app.get('/api/waitlist',(req, res) => res.json(waitlist));

app.put('/api/tables/:id/status', (req, res) => {
  const t = tables.find(t => t.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.status = req.body.status;
  res.json(t);
});

app.post('/api/waitlist', (req, res) => {
  const entry = { id: Date.now(), ...req.body };
  waitlist.push(entry);
  res.status(201).json(entry);
});

app.delete('/api/waitlist/:id', (req, res) => {
  waitlist = waitlist.filter(w => w.id !== Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/orders', (req, res) => res.json([]));

app.listen(5000, () => console.log('Basque backend → http://localhost:5000'));
