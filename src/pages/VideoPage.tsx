import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";

const VideoPage = () => {
  return (
    <Layout>
       <div className="container mx-auto px-4 py-8">
        <ContentBrowser 
          contentType="video"
          title="Video Library"
          description="Watch educational lectures and documentaries"
        />
      </div>
    </Layout>
  );
};

export default VideoPage;
