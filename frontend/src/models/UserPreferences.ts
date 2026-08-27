import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  ownerAddress: string;
  email: string;
}

const UserPreferencesSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true }
});

export default mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
