'use server'

import dbConnect from '@/lib/mongodb';
import { Author, Publisher } from '@/models/BookMetadata';

// ============ AUTHOR ACTIONS ============
export async function getAuthors() {
  await dbConnect();
  const authors = await Author.find().sort({ name: 1 }).lean();
  return {
    data: authors.map((a: any) => ({
      id: a._id.toString(),
      name: a.name,
      deen: a.deen || '',
      mazhab: a.mazhab || '',
      fiqh: a.fiqh || '',
    })),
    error: null,
  };
}

export async function createAuthor(data: { name: string; deen?: string; mazhab?: string; fiqh?: string }) {
  await dbConnect();
  try {
    const author = await Author.create(data);
    return { data: { id: author._id.toString(), name: author.name }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updateAuthor(id: string, data: { name: string; deen?: string; mazhab?: string; fiqh?: string }) {
  await dbConnect();
  try {
    const author = await Author.findByIdAndUpdate(id, data, { new: true });
    if (!author) throw new Error("Author not found");
    return { data: true, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { error: e.message || e };
  }
}

export async function deleteAuthor(id: string) {
  await dbConnect();
  try {
    await Author.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e.message || e };
  }
}

// ============ PUBLISHER ACTIONS ============
export async function getPublishers() {
  await dbConnect();
  const publishers = await Publisher.find().sort({ name: 1 }).lean();
  return {
    data: publishers.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      country: p.country || '',
    })),
    error: null,
  };
}

export async function createPublisher(data: { name: string; country?: string }) {
  await dbConnect();
  try {
    const publisher = await Publisher.create(data);
    return { data: { id: publisher._id.toString(), name: publisher.name }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updatePublisher(id: string, data: { name: string; country?: string }) {
  await dbConnect();
  try {
    const publisher = await Publisher.findByIdAndUpdate(id, data, { new: true });
    if (!publisher) throw new Error("Publisher not found");
    return { data: true, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { error: e.message || e };
  }
}

export async function deletePublisher(id: string) {
  await dbConnect();
  try {
    await Publisher.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e.message || e };
  }
}
