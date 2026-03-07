import mongoose, { Document, Schema } from 'mongoose';

export type ColumnType = 'todo' | 'inprogress' | 'done';

export interface ICard extends Document {
  workspaceId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  column: ColumnType;
  assigneeId?: mongoose.Types.ObjectId;
  order: number;
  createdBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const cardSchema = new Schema<ICard>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  column: { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  order: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

cardSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

cardSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

export default mongoose.model<ICard>('Card', cardSchema);
