'use server'

import dbConnect from '@/lib/mongodb';
import { MediaAnalytics, Favorite, PlaylistItem } from '@/models/Interactions';
import { Media } from '@/models/Media';

export async function trackAction(mediaId: string, userId: string | null, actionType: 'view' | 'download' | 'play') {
  await dbConnect();
  try {
    const analytics = await MediaAnalytics.create({
      media_id: mediaId,
      user_id: userId,
      action_type: actionType
    });
    return { data: analytics, error: null };
  } catch (error) {
    return { error };
  }
}

export async function getAnalytics(dateFilter?: string) {
  await dbConnect();
  try {
    const query = dateFilter ? { createdAt: { $gte: new Date(dateFilter) } } : {};
    
    // Fetch analytics counts
    const analyticsData = await MediaAnalytics.find(query).select('action_type media_id').lean();
    
    const views = analyticsData.filter(a => a.action_type === 'view').length;
    const downloads = analyticsData.filter(a => a.action_type === 'download').length;
    const plays = analyticsData.filter(a => a.action_type === 'play').length;
    
    // Fetch media counts
    const mediaData = await Media.find({ status: 'شائع شدہ' }).select('type').lean();
    
    const totalMedia = mediaData.length;
    const audioCount = mediaData.filter(m => m.type === 'آڈیو').length;
    const videoCount = mediaData.filter(m => m.type === 'ویڈیو').length;
    
    // Calculate top media
    const viewCounts: Record<string, number> = {};
    const viewsData = analyticsData.filter(a => a.action_type === 'view');
    viewsData.forEach(item => {
      viewCounts[item.media_id] = (viewCounts[item.media_id] || 0) + 1;
    });
    
    const topMediaIds = Object.entries(viewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
      
    let topMedia: any[] = [];
    if (topMediaIds.length > 0) {
      const topMediaData = await Media.find({ _id: { $in: topMediaIds } }).select('title type').lean();
      
      topMedia = topMediaData.map(m => ({
        id: m._id.toString(),
        title: m.title,
        type: m.type,
        views: viewCounts[m._id.toString()] || 0
      })).sort((a, b) => b.views - a.views);
    }

    return {
      data: {
        totalViews: views,
        totalDownloads: downloads,
        totalPlays: plays,
        totalMedia,
        audioCount,
        videoCount,
        recentActivity: [],
        topMedia
      },
      error: null
    };
  } catch (error) {
    return { error, data: null };
  }
}
