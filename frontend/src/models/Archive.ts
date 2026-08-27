import mongoose, { Schema, Document } from 'mongoose';

export interface IArchive extends Document {
  ownerAddress: string;
  cids: string[];
}

const ArchiveSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, unique: true, index: true },
  cids: [{ type: String }]
});

export default mongoose.models.Archive || mongoose.model<IArchive>('Archive', ArchiveSchema);
