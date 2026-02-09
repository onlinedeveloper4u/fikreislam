import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ActionType = 'view' | 'download' | 'play';

export function useAnalytics() {
  const { user } = useAuth();

  const trackAction = async (contentId: string, actionType: ActionType) => {
    try {
      await supabase.from('content_analytics').insert({
        content_id: contentId,
        user_id: user?.id || null,
        action_type: actionType,
      });
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.error('Analytics tracking error:', error);
    }
  };

  const trackView = (contentId: string) => trackAction(contentId, 'view');
  const trackDownload = (contentId: string) => trackAction(contentId, 'download');
  const trackPlay = (contentId: string) => trackAction(contentId, 'play');

  return {
    trackView,
    trackDownload,
    trackPlay,
    trackAction,
  };
}