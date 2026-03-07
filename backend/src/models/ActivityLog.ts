import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  workspaceId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityTitle: string;
  entityId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityTitle: { type: String, default: '' },
  entityId: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
