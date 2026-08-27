import mongoose, { Schema, Document } from 'mongoose';

export interface IDraft extends Document {
  ownerAddress: string;
  toAlias: string;
  content: string;
  lastUpdated: Date;
}

const DraftSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, index: true },
  toAlias: { type: String, default: '' },
  content: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now }
});

// Since a user can only have one active draft at a time for simplicity
DraftSchema.index({ ownerAddress: 1 }, { unique: true });

export default mongoose.models.Draft || mongoose.model<IDraft>('Draft', DraftSchema);
