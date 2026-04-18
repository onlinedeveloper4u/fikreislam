import mongoose, { Schema, Document } from 'mongoose';

export interface IContentAnalytics extends Document {
  content_id: string; // Foreign key
  user_id?: string;
  action_type: 'view' | 'download' | 'play';
  createdAt: Date;
}

const ContentAnalyticsSchema = new Schema<IContentAnalytics>({
  content_id: { type: String, required: true },
  user_id: { type: String },
  action_type: { type: String, enum: ['view', 'download', 'play'], required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'content_analytics' });

export const ContentAnalytics = mongoose.models.ContentAnalytics || mongoose.model<IContentAnalytics>('ContentAnalytics', ContentAnalyticsSchema);

export interface IFavorite extends Document {
  content_id: string;
  user_id: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  content_id: { type: String, required: true },
  user_id: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'favorites' });

FavoriteSchema.index({ content_id: 1, user_id: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export interface IPlaylistItem extends Document {
  content_id: string;
  playlist_id?: string;
  user_id: string;
  createdAt: Date;
}

const PlaylistItemSchema = new Schema<IPlaylistItem>({
  content_id: { type: String, required: true },
  playlist_id: { type: String },
  user_id: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'playlist_items' });

export const PlaylistItem = mongoose.models.PlaylistItem || mongoose.model<IPlaylistItem>('PlaylistItem', PlaylistItemSchema);
