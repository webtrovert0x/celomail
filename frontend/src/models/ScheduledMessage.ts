import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledMessage extends Document {
  ownerAddress: string;
  recipients: string[];
  subject: string;
  content: string;
  paymentAmount?: string;
  attachmentCID?: string;
  sendAt: Date;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: Date;
}

const ScheduledMessageSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, index: true },
  recipients: [{ type: String, required: true }],
  subject: { type: String, default: '' },
  content: { type: String, required: true },
  paymentAmount: { type: String, default: '' },
  attachmentCID: { type: String, default: '' },
  sendAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['pending', 'sent', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ScheduledMessage || mongoose.model<IScheduledMessage>('ScheduledMessage', ScheduledMessageSchema);
