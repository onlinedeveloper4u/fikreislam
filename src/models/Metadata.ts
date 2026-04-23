import mongoose, { Schema, Document } from 'mongoose';

export interface ISpeaker extends Document {
  name: string;
}
const SpeakerSchema = new Schema<ISpeaker>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true, collection: 'speakers' });

export const Speaker = mongoose.models.Speaker || mongoose.model<ISpeaker>('Speaker', SpeakerSchema);

export interface ILanguage extends Document {
  name: string;
}
const LanguageSchema = new Schema<ILanguage>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true, collection: 'languages' });
export const Language = mongoose.models.Language || mongoose.model<ILanguage>('Language', LanguageSchema);

export interface ICategory extends Document {
  name: string;
}
const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true, collection: 'categories' });
export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export interface IMediaType extends Document {
  name: string;
}
const MediaTypeSchema = new Schema<IMediaType>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true, collection: 'media_types' });
export const MediaType = mongoose.models.MediaType || mongoose.model<IMediaType>('MediaType', MediaTypeSchema);
