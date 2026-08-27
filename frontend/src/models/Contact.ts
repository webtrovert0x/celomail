import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  ownerAddress: string;
  alias: string;
  contactAddress: string;
  addedAt: Date;
}

const ContactSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, index: true },
  alias: { type: String, required: true },
  contactAddress: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

// Ensure a user cannot add the same alias twice
ContactSchema.index({ ownerAddress: 1, alias: 1 }, { unique: true });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
