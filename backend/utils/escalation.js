import { Complaint } from '../models/Complaint.js';

export async function escalateOverdueComplaints() {
  try {
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = await Complaint.updateMany(
      {
        status: { $in: ['open', 'in-progress'] },
        createdAt: { $lt: threshold },
      },
      {
        $set: { status: 'escalated' },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Auto-Escalation] Escalated ${result.modifiedCount} overdue complaints.`);
    }
  } catch (err) {
    console.error('[Auto-Escalation] Error running escalation checks:', err);
  }
}
