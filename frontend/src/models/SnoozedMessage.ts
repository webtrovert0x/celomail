import mongoose, { Schema, Document } from 'mongoose';

export interface ISnoozedMessage extends Document {
  ownerAddress: string;
  cid: string;
  snoozeUntil: Date;
  createdAt: Date;
}

const SnoozedMessageSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, index: true },
  cid: { type: String, required: true },
  snoozeUntil: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SnoozedMessage || mongoose.model<ISnoozedMessage>('SnoozedMessage', SnoozedMessageSchema);
