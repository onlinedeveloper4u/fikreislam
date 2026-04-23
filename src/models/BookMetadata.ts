import mongoose, { Schema, Document, Types } from 'mongoose';

// ============ AUTHOR ============
export interface IAuthor extends Document {
  name: string;
  deen?: string;
  mazhab?: string;
  fiqh?: string;
}

const AuthorSchema = new Schema<IAuthor>({
  name: { type: String, required: true, unique: true },
  deen: { type: String },
  mazhab: { type: String },
  fiqh: { type: String },
}, { timestamps: true, collection: 'authors' });

export const Author = mongoose.models.Author || mongoose.model<IAuthor>('Author', AuthorSchema);

// ============ PUBLISHER ============
export interface IPublisher extends Document {
  name: string;
  country?: string;
}

const PublisherSchema = new Schema<IPublisher>({
  name: { type: String, required: true, unique: true },
  country: { type: String },
}, { timestamps: true, collection: 'publishers' });

export const Publisher = mongoose.models.Publisher || mongoose.model<IPublisher>('Publisher', PublisherSchema);

// ============ WORK ============
export interface IWork extends Document {
  primaryTitle: string;
  titles: string[];
  type: 'book' | 'article' | 'fatwa' | 'other';
  authors: Types.ObjectId[];
  originalLanguage: Types.ObjectId;
  categories: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkSchema = new Schema<IWork>({
  primaryTitle: { type: String, required: true },
  titles: { type: [String], default: [] },
  type: { type: String, enum: ['book', 'article', 'fatwa', 'other'], required: true },
  authors: [{ type: Schema.Types.ObjectId, ref: 'Author' }],
  originalLanguage: { type: Schema.Types.ObjectId, ref: 'Language' },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true, collection: 'works' });

export const Work = mongoose.models.Work || mongoose.model<IWork>('Work', WorkSchema);

// ============ PUBLICATION ============
export interface IIAIdentifier {
  volume: number;
  identifier: string;
}

export interface IPublication extends Document {
  workId: Types.ObjectId;
  title: string;
  isTranslation: boolean;
  translationLanguage?: Types.ObjectId;
  translators: Types.ObjectId[];
  publisher?: Types.ObjectId;
  edition: {
    number?: number;
    year?: number;
  };
  totalPages?: number;
  volumes: number;
  iaIdentifiers: IIAIdentifier[];
  createdAt: Date;
  updatedAt: Date;
}

const PublicationSchema = new Schema<IPublication>({
  workId: { type: Schema.Types.ObjectId, ref: 'Work', required: true },
  title: { type: String, required: true },
  isTranslation: { type: Boolean, default: false },
  translationLanguage: { type: Schema.Types.ObjectId, ref: 'Language' },
  translators: [{ type: Schema.Types.ObjectId, ref: 'Author' }],
  publisher: { type: Schema.Types.ObjectId, ref: 'Publisher' },
  edition: {
    number: { type: Number },
    year: { type: Number },
  },
  totalPages: { type: Number },
  volumes: { type: Number, default: 1, required: true },
  iaIdentifiers: [{
    _id: false,
    volume: { type: Number, required: true },
    identifier: { type: String, required: true },
  }],
}, { timestamps: true, collection: 'publications' });

export const Publication = mongoose.models.Publication || mongoose.model<IPublication>('Publication', PublicationSchema);
