import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaAnalytics extends Document {
  media_id: string; // Foreign key
  user_id?: string;
  action_type: 'view' | 'download' | 'play';
  createdAt: Date;
}

const MediaAnalyticsSchema = new Schema<IMediaAnalytics>({
  media_id: { type: String, required: true },
  user_id: { type: String },
  action_type: { type: String, enum: ['view', 'download', 'play'], required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'content_analytics' });

export const MediaAnalytics = mongoose.models.MediaAnalytics || mongoose.model<IMediaAnalytics>('MediaAnalytics', MediaAnalyticsSchema);

export interface IFavorite extends Document {
  media_id: string;
  user_id: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  media_id: { type: String, required: true },
  user_id: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'favorites' });

FavoriteSchema.index({ media_id: 1, user_id: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export interface IPlaylistItem extends Document {
  media_id: string;
  playlist_id?: string;
  user_id: string;
  createdAt: Date;
}

const PlaylistItemSchema = new Schema<IPlaylistItem>({
  media_id: { type: String, required: true },
  playlist_id: { type: String },
  user_id: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'playlist_items' });

export const PlaylistItem = mongoose.models.PlaylistItem || mongoose.model<IPlaylistItem>('PlaylistItem', PlaylistItemSchema);
