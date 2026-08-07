import mongoose from 'mongoose';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Mess/Food',
  'Cleanliness',
  'Noise',
  'Other',
];

const STATUSES = ['open', 'in-progress', 'resolved', 'escalated'];

const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 120,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    feedback: {
      type: feedbackSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ title: 'text', description: 'text', location: 'text' });

const Complaint = mongoose.model('Complaint', complaintSchema);

export { Complaint, CATEGORIES, STATUSES };
