import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  ownerAddress: string;
  email?: string;
  telegramChatId?: string;
  webPushEnabled?: boolean;
}

const UserPreferencesSchema: Schema = new Schema({
  ownerAddress: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: '' },
  telegramChatId: { type: String, default: '' },
  webPushEnabled: { type: Boolean, default: false }
});

export default mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
