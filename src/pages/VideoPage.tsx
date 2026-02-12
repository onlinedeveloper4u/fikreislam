import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";
import { useTranslation } from "react-i18next";

const VideoPage = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ContentBrowser
          contentType="video"
          title={t('content.browser.videoLibrary')}
          description={t('content.browser.videoDesc')}
        />
      </div>
    </Layout>
  );
};

export default VideoPage;
