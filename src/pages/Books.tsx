import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";
import { useTranslation } from "react-i18next";

const Books = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ContentBrowser
          contentType="book"
          title={t('content.browser.booksLibrary')}
          description={t('content.browser.booksDesc')}
        />
      </div>
    </Layout>
  );
};

export default Books;
