import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  tripId: string;
  touristIds: string[]; // references blockchainId
}

const TripSchema = new Schema<ITrip>({
  tripId: { type: String, required: true, unique: true },
  touristIds: [{ type: String }]
});

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
