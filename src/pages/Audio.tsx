import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";
import { useTranslation } from "react-i18next";

const Audio = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ContentBrowser
          contentType="audio"
          title={t('content.browser.audioLibrary')}
          description={t('content.browser.audioDesc')}
        />
      </div>
    </Layout>
  );
};

export default Audio;
