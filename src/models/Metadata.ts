import mongoose, { Schema, Document } from 'mongoose';

export interface ISpeaker extends Document {
  name: string;
}
const SpeakerSchema = new Schema<ISpeaker>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

export const Speaker = mongoose.models.Speaker || mongoose.model<ISpeaker>('Speaker', SpeakerSchema);

export interface ILanguage extends Document {
  name: string;
}
const LanguageSchema = new Schema<ILanguage>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });
export const Language = mongoose.models.Language || mongoose.model<ILanguage>('Language', LanguageSchema);

export interface ICategory extends Document {
  name: string;
}
const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });
export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export interface IAudioType extends Document {
  name: string;
}
const AudioTypeSchema = new Schema<IAudioType>({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });
export const AudioType = mongoose.models.AudioType || mongoose.model<IAudioType>('AudioType', AudioTypeSchema);
