import { useAuth } from '@/contexts/AuthContext';
import { trackAction } from '@/actions/analytics';

type ActionType = 'view' | 'download' | 'play';

export function useAnalytics() {
  const { user } = useAuth();

  const trackActionClient = async (contentId: string, actionType: ActionType) => {
    try {
      await trackAction(contentId, user?.id || null, actionType);
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.error('Analytics tracking error:', error);
    }
  };

  const trackView = (contentId: string) => trackActionClient(contentId, 'view');
  const trackDownload = (contentId: string) => trackActionClient(contentId, 'download');
  const trackPlay = (contentId: string) => trackActionClient(contentId, 'play');

  return {
    trackView,
    trackDownload,
    trackPlay,
    trackAction: trackActionClient,
  };
}