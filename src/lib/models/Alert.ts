import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  alertId: string;
  touristId: string;
  tripId: string;
  type: string;
  status: 'Active' | 'Resolved';
  timestamp: Date;
}

const AlertSchema = new Schema<IAlert>({
  alertId: { type: String, required: true, unique: true },
  touristId: { type: String, required: true },
  tripId: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  timestamp: { type: Date, default: Date.now }
});

// 🚀 PRODUCTION INDEXES
AlertSchema.index({ alertId: 1 });
AlertSchema.index({ touristId: 1 });
AlertSchema.index({ status: 1 });
AlertSchema.index({ timestamp: -1 });

export default mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);

