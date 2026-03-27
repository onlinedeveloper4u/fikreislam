'use server'

import dbConnect from '@/lib/mongodb';
import { ContentAnalytics, Favorite, PlaylistItem } from '@/models/Interactions';
import { Content } from '@/models/Content';

export async function trackAction(contentId: string, userId: string | null, actionType: 'view' | 'download' | 'play') {
  await dbConnect();
  try {
    const analytics = await ContentAnalytics.create({
      content_id: contentId,
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
    const analyticsData = await ContentAnalytics.find(query).select('action_type content_id').lean();
    
    const views = analyticsData.filter(a => a.action_type === 'view').length;
    const downloads = analyticsData.filter(a => a.action_type === 'download').length;
    const plays = analyticsData.filter(a => a.action_type === 'play').length;
    
    // Fetch content counts
    const contentData = await Content.find({ status: 'approved' }).select('type').lean();
    
    const totalContent = contentData.length;
    const bookCount = contentData.filter(c => c.type === 'book').length;
    const audioCount = contentData.filter(c => c.type === 'audio').length;
    const videoCount = contentData.filter(c => c.type === 'video').length;
    
    // Calculate top content
    const viewCounts: Record<string, number> = {};
    const viewsData = analyticsData.filter(a => a.action_type === 'view');
    viewsData.forEach(item => {
      viewCounts[item.content_id] = (viewCounts[item.content_id] || 0) + 1;
    });
    
    const topContentIds = Object.entries(viewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
      
    let topContent: any[] = [];
    if (topContentIds.length > 0) {
      const topContentData = await Content.find({ _id: { $in: topContentIds } }).select('title type').lean();
      
      topContent = topContentData.map(c => ({
        id: c._id.toString(),
        title: c.title,
        type: c.type,
        views: viewCounts[c._id.toString()] || 0
      })).sort((a, b) => b.views - a.views);
    }

    return {
      data: {
        totalViews: views,
        totalDownloads: downloads,
        totalPlays: plays,
        totalContent,
        bookCount,
        audioCount,
        videoCount,
        recentActivity: [],
        topContent
      },
      error: null
    };
  } catch (error) {
    return { error, data: null };
  }
}
