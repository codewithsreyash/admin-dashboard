import mongoose, { Schema, Document } from 'mongoose';

export interface ITourist extends Document {
  blockchainId: string;
  name: string;
  tripId: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  safetyScore: number;
  lastPing: Date;
}

const TouristSchema = new Schema<ITourist>({
  blockchainId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tripId: { type: String, required: true },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  safetyScore: { type: Number, default: 100 },
  lastPing: { type: Date, default: Date.now }
});

// 🚀 PRODUCTION INDEXES: Crucial for high-traffic lookups
TouristSchema.index({ blockchainId: 1 });
TouristSchema.index({ tripId: 1 });
TouristSchema.index({ lastPing: -1 });

export default mongoose.models.Tourist || mongoose.model<ITourist>('Tourist', TouristSchema);

