'use server'

import dbConnect from '@/lib/mongodb';
import { Content } from '@/models/Content';
import { ContentAnalytics, Favorite, PlaylistItem } from '@/models/Interactions';

// CONTENT ACTIONS
export async function getContent(limit: number = 1000) {
  await dbConnect();
  try {
    const data = await Content.find().sort({ createdAt: -1 }).limit(limit).lean();
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

export async function getApprovedContent(limit: number = 100) {
  await dbConnect();
  try {
    const data = await Content.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(limit).lean();
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

export async function updateContentStatus(id: string, status: string, published_at?: string) {
  await dbConnect();
  try {
    const updatePayload: any = { status };
    if (published_at) updatePayload.published_at = new Date(published_at);
    
    const res = await Content.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!res) return { error: 'Content not found' };
    return { data: JSON.parse(JSON.stringify({ ...res, id: res._id.toString() })), error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function deleteContentById(id: string) {
  await dbConnect();
  try {
    await ContentAnalytics.deleteMany({ content_id: id });
    await Favorite.deleteMany({ content_id: id });
    await PlaylistItem.deleteMany({ content_id: id });
    await Content.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (error) {
    return { error };
  }
}

export async function insertContent(payload: any) {
  await dbConnect();
  try {
    const content = await Content.create(payload);
    const plain = JSON.parse(JSON.stringify(content.toObject()));
    return { data: { ...plain, id: plain._id.toString() }, error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function updateContentById(id: string, payload: any) {
  await dbConnect();
  try {
    const content = await Content.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!content) return { error: 'Content not found' };
    const plain = JSON.parse(JSON.stringify(content));
    return { data: { ...plain, id: plain._id.toString() }, error: null };
  } catch (error: any) {
    return { error: error.message || error };
  }
}
