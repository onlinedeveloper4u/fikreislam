'use server'

import dbConnect from '@/lib/mongodb';
import { Speaker, Language, Category, AudioType } from '@/models/Metadata';
import { Content } from '@/models/Content';

// SPEAKER ACTIONS
export async function getSpeakers() {
  await dbConnect();
  const speakers = await Speaker.find().sort({ name: 1 }).lean();
  return { data: speakers.map(s => ({ ...s, id: s._id.toString(), _id: s._id.toString() })), error: null };
}

export async function createSpeaker(name: string) {
  await dbConnect();
  try {
    const speaker = await Speaker.create({ name });
    return { data: { id: speaker._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e };
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
    await Content.updateMany({ speaker: oldName }, { speaker: name });
    await AudioType.updateMany({ speaker_id: id }, {});
    
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
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
  return { data: res.map(s => ({ ...s, id: s._id.toString(), _id: s._id.toString() })), error: null };
}

export async function createLanguage(name: string) {
  await dbConnect();
  try {
    const lng = await Language.create({ name });
    return { data: { id: lng._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e };
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
    await Content.updateMany({ language: oldName }, { language: name });
    
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
  return { data: res.map(s => ({ ...s, id: s._id.toString(), _id: s._id.toString() })), error: null };
}

export async function createCategory(name: string) {
  await dbConnect();
  try {
    const cat = await Category.create({ name });
    return { data: { id: cat._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e };
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
    await Content.updateMany(
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

// AUDIO TYPE ACTIONS
export async function getAudioTypes(speaker_id?: string) {
  await dbConnect();
  const query = speaker_id ? { speaker_id } : {};
  const res = await AudioType.find(query).sort({ name: 1 }).lean();
  return { data: res.map(s => ({ ...s, id: s._id.toString(), _id: s._id.toString() })), error: null };
}

export async function createAudioType(name: string, speaker_id: string) {
  await dbConnect();
  try {
    const at = await AudioType.create({ name, speaker_id });
    return { data: { id: at._id.toString() }, error: null };
  } catch (e: any) {
    if (e.code === 11000) return { data: null, error: { code: '23505', message: 'یہ نام پہلے سے موجود ہے' } };
    return { data: null, error: e };
  }
}

export async function updateAudioType(id: string, name: string, speakerName?: string) {
  await dbConnect();
  try {
    const at = await AudioType.findById(id);
    if (!at) throw new Error("Not found");
    const oldName = at.name;
    at.name = name;
    await at.save();
    
    if (speakerName) {
      // Cascade update
      await Content.updateMany(
        { speaker: speakerName, audio_type: oldName },
        { audio_type: name }
      );
    }
    
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function deleteAudioType(id: string) {
  await dbConnect();
  try {
    await AudioType.findByIdAndDelete(id);
    return { data: true, error: null };
  } catch (e: any) {
    return { error: e };
  }
}

export async function getAudioTypesBySpeakerName(speakerName: string) {
  await dbConnect();
  const speaker = await Speaker.findOne({ name: speakerName }).lean();
  if (!speaker) return { data: [], error: null };
  
  const types = await AudioType.find({ speaker_id: speaker._id.toString() }).sort({ name: 1 }).lean();
  return { data: types.map(t => ({ name: t.name })), error: null };
}
