import { Router } from 'express';
import { Complaint, CATEGORIES, STATUSES } from '../models/Complaint.js';
import { getNextTicketId } from '../models/Counter.js';
import { escalateOverdueComplaints } from '../utils/escalation.js';

const router = Router();

// GET /api/complaints — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    await escalateOverdueComplaints();
    const { status, category, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints/meta — categories & statuses (helper for frontend)
router.get('/meta', (_req, res) => {
  res.json({ success: true, data: { categories: CATEGORIES, statuses: STATUSES } });
});

// GET /api/complaints/:id — single complaint by MongoDB _id or ticketId
router.get('/:id', async (req, res, next) => {
  try {
    await escalateOverdueComplaints();
    const { id } = req.params;
    const query = id.startsWith('HC-') ? { ticketId: id } : { _id: id };

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// POST /api/complaints — create
router.post('/', async (req, res, next) => {
  try {
    const { title, category, description, location, photoUrl } = req.body;

    if (!title || !category || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'title, category, description, and location are required',
      });
    }

    const ticketId = await getNextTicketId();

    const complaint = await Complaint.create({
      ticketId,
      title,
      category,
      description,
      location,
      photoUrl: photoUrl || null,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/complaints/:id — partial update (status, feedback, upvotes, etc.)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = [
      'title',
      'category',
      'description',
      'location',
      'photoUrl',
      'status',
      'upvotes',
      'feedback',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    if (updates.status !== undefined) {
      const passcode = req.headers['x-admin-passcode'];
      if (!passcode || passcode !== process.env.ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid admin passcode' });
      }
    }

    const query = id.startsWith('HC-') ? { ticketId: id } : { _id: id };
    const complaint = await Complaint.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true,
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('HC-') ? { ticketId: id } : { _id: id };

    const complaint = await Complaint.findOneAndDelete(query);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, message: `Complaint ${complaint.ticketId} deleted` });
  } catch (err) {
    next(err);
  }
});

export default router;
