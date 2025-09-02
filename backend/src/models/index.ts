import mongoose, { Schema, Document } from 'mongoose';

interface ICall extends Document {
  callId: string;
  direction: 'incoming' | 'outgoing';
  fromNumber: string;
  toNumber: string;
  start: Date;
  answered: Date | null;
  end: Date | null;
  durationSec: number;
  areaCode: string | null;
  cost: number;
  day: string;
  createdAt: Date;
}

interface IAppMeta extends Document {
  _id: string;
  version: string;
  cdrPort: number;
  lastUpdated: Date;
}

const CallSchema = new Schema<ICall>({
  callId: { type: String, required: true, unique: true },
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  fromNumber: { type: String, required: true },
  toNumber: { type: String, required: true },
  start: { type: Date, required: true },
  answered: { type: Date, default: null },
  end: { type: Date, default: null },
  durationSec: { type: Number, default: 0 },
  areaCode: { type: String, default: null },
  cost: { type: Number, default: 0 },
  day: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
CallSchema.index({ day: 1 });
CallSchema.index({ start: 1 });
CallSchema.index({ direction: 1 });
CallSchema.index({ areaCode: 1 });
CallSchema.index({ callId: 1 }, { unique: true });

const AppMetaSchema = new Schema<IAppMeta>({
  _id: { type: String, default: 'meta' },
  version: { type: String, required: true },
  cdrPort: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

export const Call = mongoose.model<ICall>('Call', CallSchema);
export const AppMeta = mongoose.model<IAppMeta>('AppMeta', AppMetaSchema);
