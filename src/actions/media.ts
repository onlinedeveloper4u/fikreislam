'use server'

import dbConnect from '@/lib/mongodb';
import { Media } from '@/models/Media';
import { MediaAnalytics, Favorite, PlaylistItem } from '@/models/Interactions';

// MEDIA ACTIONS
export async function getMedia(limit: number = 1000) {
  await dbConnect();
  try {
    const data = await Media.find().sort({ createdAt: -1 }).limit(limit).lean();
    return { 
      data: data.map(d => {
            const { _id, createdAt, updatedAt, __v, ...rest }: any = d;
            return {
                ...rest,
                id: _id.toString(),
                created_at: createdAt ? new Date(createdAt).toISOString() : null,
                updated_at: updatedAt ? new Date(updatedAt).toISOString() : null
            };
      }), 
      error: null 
    };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function getApprovedMedia(limit: number = 100) {
  await dbConnect();
  try {
    const data = await Media.find({ status: 'شائع شدہ' }).sort({ createdAt: -1 }).limit(limit).lean();
    return { 
      data: data.map(d => {
            const { _id, createdAt, updatedAt, __v, ...rest }: any = d;
            return {
                ...rest,
                id: _id.toString(),
                created_at: createdAt ? new Date(createdAt).toISOString() : null,
                updated_at: updatedAt ? new Date(updatedAt).toISOString() : null
            };
      }), 
      error: null 
    };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function updateMediaStatus(id: string, status: string) {
  await dbConnect();
  try {
    const updatePayload: any = { status };
    
    const res = await Media.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!res) return { error: 'Media not found' };
    return { data: JSON.parse(JSON.stringify({ ...res, id: res._id.toString() })), error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function deleteMediaById(id: string) {
  await dbConnect();
  try {
    await MediaAnalytics.deleteMany({ media_id: id });
    await Favorite.deleteMany({ media_id: id });
    await PlaylistItem.deleteMany({ media_id: id });
    await Media.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (error) {
    return { error };
  }
}

export async function insertMedia(payload: any) {
  await dbConnect();
  try {
    const media = await Media.create(payload);
    const plain = JSON.parse(JSON.stringify(media.toObject()));
    return { data: { ...plain, id: plain._id.toString() }, error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function updateMediaById(id: string, payload: any) {
  await dbConnect();
  try {
    const media = await Media.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!media) return { error: 'Media not found' };
    const plain = JSON.parse(JSON.stringify(media));
    return { data: { ...plain, id: plain._id.toString() }, error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}
