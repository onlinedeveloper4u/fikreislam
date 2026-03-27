import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  title: string;
  description?: string;
  author?: string;
  type: 'book' | 'audio' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  language?: string;
  file_url?: string;
  cover_image_url?: string;
  file_size?: number;
  contributor_id?: string;
  published_at?: Date;
  
  // Audio specific
  duration?: string;
  venue?: string;
  speaker?: string;
  audio_type?: string;
  categories?: string[];
  lecture_date_gregorian?: Date;
  hijri_date_day?: number;
  hijri_date_month?: string;
  hijri_date_year?: number;
  
  // Audio & Video
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>({
  title: { type: String, required: true },
  description: { type: String },
  author: { type: String },
  type: { type: String, enum: ['book', 'audio', 'video'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  language: { type: String },
  file_url: { type: String },
  cover_image_url: { type: String },
  file_size: { type: Number },
  contributor_id: { type: String },
  published_at: { type: Date },
  
  duration: { type: String },
  venue: { type: String },
  speaker: { type: String },
  audio_type: { type: String },
  categories: { type: [String], default: [] },
  lecture_date_gregorian: { type: Date },
  hijri_date_day: { type: Number },
  hijri_date_month: { type: String },
  hijri_date_year: { type: Number },
  
  tags: { type: [String], default: [] }
}, { timestamps: true });

export const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
