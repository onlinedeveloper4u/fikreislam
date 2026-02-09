import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContentStats {
  books: number;
  audio: number;
  video: number;
  contributors: number;
}

export function useContentStats() {
  return useQuery({
    queryKey: ["content-stats"],
    queryFn: async (): Promise<ContentStats> => {
      // Fetch counts for each content type
      const [booksResult, audioResult, videoResult, contributorsResult] = await Promise.all([
        supabase
          .from("content_public")
          .select("id", { count: "exact", head: true })
          .eq("type", "book")
          .eq("status", "approved"),
        supabase
          .from("content_public")
          .select("id", { count: "exact", head: true })
          .eq("type", "audio")
          .eq("status", "approved"),
        supabase
          .from("content_public")
          .select("id", { count: "exact", head: true })
          .eq("type", "video")
          .eq("status", "approved"),
        supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "contributor"),
      ]);

      return {
        books: booksResult.count ?? 0,
        audio: audioResult.count ?? 0,
        video: videoResult.count ?? 0,
        contributors: contributorsResult.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
