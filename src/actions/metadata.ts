'use server'

import dbConnect from '@/lib/mongodb';
import { Speaker, Language, Category, MediaType } from '@/models/Metadata';
import { Media } from '@/models/Media';

// SPEAKER ACTIONS
export async function getSpeakers() {
  await dbConnect();
  const speakers = await Speaker.find().sort({ name: 1 }).lean();
  return { 
    data: speakers.map(s => {
        const { _id, createdAt, updatedAt, __v, ...rest }: any = s;
        return { 
            ...rest, 
            id: _id.toString() 
        };
    }), 
    error: null 
  };
}

export async function createSpeaker(name: string) {
  await dbConnect();
  try {
    const speaker = await Speaker.create({ name });
    return { data: { id: speaker._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updateSpeaker(id: string, name: string) {
  await dbConnect();
  try {
    const speaker = await Speaker.findById(id);
    if (!speaker) throw new Error("Speaker not found");
    const oldName = speaker.name;
    speaker.name = name;
    await speaker.save();
    
    // Cascade update
    await Media.updateMany({ speaker: oldName }, { speaker: name });
    
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e.message || e };
  }
}

export async function deleteSpeaker(id: string) {
  await dbConnect();
  try {
    await Speaker.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

// LANGUAGE ACTIONS
export async function getLanguages() {
  await dbConnect();
  const res = await Language.find().sort({ name: 1 }).lean();
  return { 
    data: res.map(s => {
        const { _id, createdAt, updatedAt, __v, ...rest }: any = s;
        return { 
            ...rest, 
            id: _id.toString() 
        };
    }), 
    error: null 
  };
}

export async function createLanguage(name: string) {
  await dbConnect();
  try {
    const lng = await Language.create({ name });
    const plain = lng.toObject();
    return { data: { id: plain._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updateLanguage(id: string, name: string) {
  await dbConnect();
  try {
    const lng = await Language.findById(id);
    if (!lng) throw new Error("Not found");
    const oldName = lng.name;
    lng.name = name;
    await lng.save();
    
    // Cascade Update
    await Media.updateMany({ language: oldName }, { language: name });
    
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function deleteLanguage(id: string) {
  await dbConnect();
  try {
    await Language.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

// CATEGORY ACTIONS
export async function getCategories() {
  await dbConnect();
  const res = await Category.find().sort({ name: 1 }).lean();
  return { 
    data: res.map(s => {
        const { _id, createdAt, updatedAt, __v, ...rest }: any = s;
        return { 
            ...rest, 
            id: _id.toString() 
        };
    }), 
    error: null 
  };
}

export async function createCategory(name: string) {
  await dbConnect();
  try {
    const cat = await Category.create({ name });
    const plain = cat.toObject();
    return { data: { id: plain._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updateCategory(id: string, name: string) {
  await dbConnect();
  try {
    const cat = await Category.findById(id);
    if (!cat) throw new Error("Not found");
    const oldName = cat.name;
    cat.name = name;
    await cat.save();
    
    // Cascade update in arrays
    await Media.updateMany(
      { categories: oldName },
      { $set: { "categories.$": name } }
    );
        
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function deleteCategory(id: string) {
  await dbConnect();
  try {
    await Category.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

// MEDIA TYPE ACTIONS
export async function getMediaTypes() {
  await dbConnect();
  const res = await MediaType.find().sort({ name: 1 }).lean();
  return { 
    data: res.map(s => {
        const { _id, createdAt, updatedAt, __v, ...rest }: any = s;
        return { 
            ...rest, 
            id: _id.toString() 
        };
    }), 
    error: null 
  };
}

export async function createMediaType(name: string) {
  await dbConnect();
  try {
    const mt = await MediaType.create({ name });
    const plain = mt.toObject();
    return { data: { id: plain._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e.message || e };
  }
}

export async function updateMediaType(id: string, name: string, speakerName?: string) {
  await dbConnect();
  try {
    const mt = await MediaType.findById(id);
    if (!mt) throw new Error("Not found");
    const oldName = mt.name;
    mt.name = name;
    await mt.save();
    
    if (speakerName) {
      // Cascade update
      await Media.updateMany(
        { speaker: speakerName, media_type: oldName },
        { media_type: name }
      );
    }
    
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function deleteMediaType(id: string) {
  await dbConnect();
  try {
    await MediaType.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function getMediaTypesBySpeakerName(speakerName: string) {
  // speakerName is currently ignored as MediaType is global
  await dbConnect();
  const types = await MediaType.find().sort({ name: 1 }).lean();
  return { data: types.map(t => ({ name: t.name })), error: null };
}
