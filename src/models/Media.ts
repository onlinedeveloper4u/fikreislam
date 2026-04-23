import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  title: string;
  type: 'آڈیو' | 'ویڈیو';
  status: 'شائع شدہ' | 'غیر شائع شدہ';
  language: string;
  file_url: string;
  cover_image_url?: string;
  file_size: number;

  // Media specific
  duration: string;
  venue?: string;
  speaker: string;
  media_type: string;
  categories?: string[];
  lecture_date_gregorian?: Date;
  hijri_date_day?: number;
  hijri_date_month?: string;
  hijri_date_year?: number;

  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  title: { type: String, required: true },
  type: { type: String, enum: ['آڈیو', 'ویڈیو'], required: true },
  status: { type: String, enum: ['شائع شدہ', 'غیر شائع شدہ'], default: 'شائع شدہ' },
  language: { type: String, required: true },
  file_url: { type: String, required: true },
  cover_image_url: { type: String },
  file_size: { type: Number, required: true },

  duration: { type: String, required: true },
  venue: { type: String },
  speaker: { type: String, required: true },
  media_type: { type: String, required: true },
  categories: { type: [String], default: [] },
  lecture_date_gregorian: { type: Date },
  hijri_date_day: { type: Number },
  hijri_date_month: { type: String },
  hijri_date_year: { type: Number }
}, { timestamps: true, collection: 'contents' });

export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
