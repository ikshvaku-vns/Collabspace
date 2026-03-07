import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  inviteToken: string;
  createdAt: Date;
  lastActiveAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  inviteToken: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

workspaceSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

export default mongoose.model<IWorkspace>('Workspace', workspaceSchema);
