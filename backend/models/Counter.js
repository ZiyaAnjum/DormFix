import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export async function getNextTicketId() {
  const counter = await Counter.findByIdAndUpdate(
    'complaint',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `HC-${String(counter.seq).padStart(3, '0')}`;
}

export default Counter;
