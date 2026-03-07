import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  timestamp: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
});

chatMessageSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
