'use server'

import dbConnect from '@/lib/mongodb';
import { Work, Publication } from '@/models/BookMetadata';

// ============ WORK ACTIONS ============

export async function getWorks() {
  await dbConnect();
  try {
    const works = await Work.find()
      .populate('authors', 'name')
      .populate('originalLanguage', 'name')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const worksWithPubCount = await Promise.all(
      works.map(async (w: any) => {
        const pubCount = await Publication.countDocuments({ workId: w._id });
        return {
          id: w._id.toString(),
          primaryTitle: w.primaryTitle,
          titles: w.titles || [],
          type: w.type,
          authors: (w.authors || []).map((a: any) => ({ id: a._id.toString(), name: a.name })),
          originalLanguage: w.originalLanguage ? { id: w.originalLanguage._id.toString(), name: w.originalLanguage.name } : null,
          categories: (w.categories || []).map((c: any) => ({ id: c._id.toString(), name: c.name })),
          publicationsCount: pubCount,
          createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : null,
        };
      })
    );

    return { data: worksWithPubCount, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function getWorkById(id: string) {
  await dbConnect();
  try {
    const w: any = await Work.findById(id)
      .populate('authors', 'name')
      .populate('originalLanguage', 'name')
      .populate('categories', 'name')
      .lean();

    if (!w) return { data: null, error: 'Work not found' };

    return {
      data: {
        id: w._id.toString(),
        primaryTitle: w.primaryTitle,
        titles: w.titles || [],
        type: w.type,
        authors: (w.authors || []).map((a: any) => ({ id: a._id.toString(), name: a.name })),
        originalLanguage: w.originalLanguage ? { id: w.originalLanguage._id.toString(), name: w.originalLanguage.name } : null,
        categories: (w.categories || []).map((c: any) => ({ id: c._id.toString(), name: c.name })),
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function createWork(payload: {
  primaryTitle: string;
  titles: string[];
  type: string;
  authors: string[];
  originalLanguage: string;
  categories: string[];
}) {
  await dbConnect();
  try {
    const work = await Work.create(payload);
    return { data: { id: work._id.toString() }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function updateWork(id: string, payload: {
  primaryTitle: string;
  titles: string[];
  type: string;
  authors: string[];
  originalLanguage: string;
  categories: string[];
}) {
  await dbConnect();
  try {
    const work = await Work.findByIdAndUpdate(id, payload, { new: true });
    if (!work) return { data: null, error: 'Work not found' };
    return { data: { id: work._id.toString() }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function deleteWork(id: string) {
  await dbConnect();
  try {
    // Delete all publications associated with this work
    await Publication.deleteMany({ workId: id });
    await Work.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

// ============ PUBLICATION ACTIONS ============

export async function getPublicationsByWork(workId: string) {
  await dbConnect();
  try {
    const pubs = await Publication.find({ workId })
      .populate('translationLanguage', 'name')
      .populate('translators', 'name')
      .populate('publisher', 'name country')
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: pubs.map((p: any) => ({
        id: p._id.toString(),
        workId: p.workId.toString(),
        title: p.title,
        isTranslation: p.isTranslation,
        translationLanguage: p.translationLanguage ? { id: p.translationLanguage._id.toString(), name: p.translationLanguage.name } : null,
        translators: (p.translators || []).map((t: any) => ({ id: t._id.toString(), name: t.name })),
        publisher: p.publisher ? { id: p.publisher._id.toString(), name: p.publisher.name, country: p.publisher.country } : null,
        edition: p.edition || {},
        totalPages: p.totalPages,
        volumes: p.volumes || 1,
        iaIdentifiers: (p.iaIdentifiers || []).map((ia: any) => ({
          volume: ia.volume,
          identifier: ia.identifier,
        })),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      })),
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function getPublicationById(id: string) {
  await dbConnect();
  try {
    const p: any = await Publication.findById(id)
      .populate('translationLanguage', 'name')
      .populate('translators', 'name')
      .populate('publisher', 'name country')
      .lean();

    if (!p) return { data: null, error: 'Publication not found' };

    return {
      data: {
        id: p._id.toString(),
        workId: p.workId.toString(),
        title: p.title,
        isTranslation: p.isTranslation,
        translationLanguage: p.translationLanguage ? { id: p.translationLanguage._id.toString(), name: p.translationLanguage.name } : null,
        translators: (p.translators || []).map((t: any) => ({ id: t._id.toString(), name: t.name })),
        publisher: p.publisher ? { id: p.publisher._id.toString(), name: p.publisher.name, country: p.publisher.country } : null,
        edition: p.edition || {},
        totalPages: p.totalPages,
        volumes: p.volumes || 1,
        iaIdentifiers: (p.iaIdentifiers || []).map((ia: any) => ({
          volume: ia.volume,
          identifier: ia.identifier,
        })),
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function createPublication(payload: {
  workId: string;
  title: string;
  isTranslation: boolean;
  translationLanguage?: string;
  translators?: string[];
  publisher?: string;
  edition?: { number?: number; year?: number };
  totalPages?: number;
  volumes: number;
  iaIdentifiers: { volume: number; identifier: string }[];
}) {
  await dbConnect();
  try {
    const pub = await Publication.create(payload);
    return { data: { id: pub._id.toString() }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function updatePublication(id: string, payload: {
  title: string;
  isTranslation: boolean;
  translationLanguage?: string;
  translators?: string[];
  publisher?: string;
  edition?: { number?: number; year?: number };
  totalPages?: number;
  volumes: number;
  iaIdentifiers: { volume: number; identifier: string }[];
}) {
  await dbConnect();
  try {
    const pub = await Publication.findByIdAndUpdate(id, payload, { new: true });
    if (!pub) return { data: null, error: 'Publication not found' };
    return { data: { id: pub._id.toString() }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}

export async function deletePublication(id: string) {
  await dbConnect();
  try {
    await Publication.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || error };
  }
}
