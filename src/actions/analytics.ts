'use server'

import dbConnect from '@/lib/mongodb';
import { MediaAnalytics } from '@/models/Interactions';
import { Media } from '@/models/Media';
import { Publication, Work } from '@/models/BookMetadata';
import { User } from '@/models/User';

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

    const chartStart = dateFilter
      ? new Date(dateFilter)
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

    const [
      actionCounts,
      mediaTypeCounts,
      topMediaCounts,
      recentActivityRaw,
      unpublishedCount,
      missingCoverCount,
      missingMetadataCount,
      missingFileCount,
      workCount,
      publicationCount,
      userRoleCounts,
    ] = await Promise.all([
      MediaAnalytics.aggregate([
        { $match: query },
        { $group: { _id: '$action_type', count: { $sum: 1 } } },
      ]),
      Media.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      MediaAnalytics.aggregate([
        { $match: { ...query, action_type: 'view' } },
        { $group: { _id: '$media_id', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
      MediaAnalytics.aggregate([
        { $match: { createdAt: { $gte: chartStart } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              action: '$action_type',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
      Media.countDocuments({ status: 'غیر شائع شدہ' }),
      Media.countDocuments({
        $or: [
          { cover_image_url: { $exists: false } },
          { cover_image_url: null },
          { cover_image_url: '' },
        ],
      }),
      Media.countDocuments({
        $or: [
          { language: { $exists: false } },
          { language: null },
          { language: '' },
          { speaker: { $exists: false } },
          { speaker: null },
          { speaker: '' },
          { media_type: { $exists: false } },
          { media_type: null },
          { media_type: '' },
          { categories: { $exists: false } },
          { categories: { $size: 0 } },
        ],
      }),
      Media.countDocuments({
        $or: [
          { file_url: { $exists: false } },
          { file_url: null },
          { file_url: '' },
        ],
      }),
      Work.countDocuments(),
      Publication.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const countFor = (rows: { _id: string; count: number }[], key: string) =>
      rows.find(row => row._id === key)?.count || 0;

    const totalViews = countFor(actionCounts, 'view');
    const totalDownloads = countFor(actionCounts, 'download');
    const totalPlays = countFor(actionCounts, 'play');
    const audioCount = countFor(mediaTypeCounts, 'آڈیو');
    const videoCount = countFor(mediaTypeCounts, 'ویڈیو');
    const totalMedia = audioCount + videoCount;

    const topMediaIds = topMediaCounts.map((item: any) => item._id);
    const topMediaData = topMediaIds.length
      ? await Media.find({ _id: { $in: topMediaIds } }).select('title type').lean()
      : [];
    const topMediaById = new Map(topMediaData.map((item: any) => [item._id.toString(), item]));
    const topMedia = topMediaCounts
      .map((item: any) => {
        const media = topMediaById.get(item._id);
        if (!media) return null;
        return {
          id: item._id,
          title: media.title,
          type: media.type,
          views: item.views,
        };
      })
      .filter(Boolean);

    const activityByDate = new Map<string, { date: string; views: number; downloads: number; plays: number; count: number }>();
    for (const row of recentActivityRaw) {
      const date = row._id.date;
      const current = activityByDate.get(date) || { date, views: 0, downloads: 0, plays: 0, count: 0 };
      if (row._id.action === 'view') current.views = row.count;
      if (row._id.action === 'download') current.downloads = row.count;
      if (row._id.action === 'play') current.plays = row.count;
      current.count += row.count;
      activityByDate.set(date, current);
    }

    const roles = {
      owners: countFor(userRoleCounts, 'owner'),
      admins: countFor(userRoleCounts, 'admin'),
      users: countFor(userRoleCounts, 'user'),
    };

    return {
      data: {
        totalViews,
        totalDownloads,
        totalPlays,
        totalMedia,
        totalWorks: workCount,
        totalPublications: publicationCount,
        audioCount,
        videoCount,
        recentActivity: Array.from(activityByDate.values()),
        topMedia,
        attention: {
          unpublishedMedia: unpublishedCount,
          missingCover: missingCoverCount,
          missingMetadata: missingMetadataCount,
          missingFile: missingFileCount,
        },
        users: roles,
      },
      error: null
    };
  } catch (error) {
    return { error, data: null };
  }
}
