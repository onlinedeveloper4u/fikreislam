'use server'

import dbConnect from '@/lib/mongodb';
import { Content } from '@/models/Content';
import { ContentAnalytics, Favorite, PlaylistItem } from '@/models/Interactions';

// CONTENT ACTIONS
export async function getContent() {
  await dbConnect();
  try {
    const data = await Content.find().sort({ createdAt: -1 }).lean();
    return { data: data.map(d => ({ ...d, id: d._id.toString(), created_at: d.createdAt })), error: null };
  } catch (error) {
    return { error };
  }
}

export async function getApprovedContent() {
  await dbConnect();
  try {
    const data = await Content.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
    return { data: data.map(d => ({ ...d, id: d._id.toString(), created_at: d.createdAt })), error: null };
  } catch (error) {
    return { error };
  }
}

export async function updateContentStatus(id: string, status: string, published_at?: string) {
  await dbConnect();
  try {
    const updatePayload: any = { status };
    if (published_at) updatePayload.published_at = new Date(published_at);
    
    const res = await Content.findByIdAndUpdate(id, updatePayload, { new: true });
    return { data: res, error: null };
  } catch (error) {
    return { error };
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
    return { data: content, error: null };
  } catch (error) {
    return { error };
  }
}

export async function updateContentById(id: string, payload: any) {
  await dbConnect();
  try {
    const content = await Content.findByIdAndUpdate(id, payload, { new: true });
    return { data: content, error: null };
  } catch (error) {
    return { error };
  }
}
