import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";

const Audio = () => {
  return (
    <Layout>
       <div className="container mx-auto px-4 py-8">
        <ContentBrowser 
          contentType="audio"
          title="Audio Library"
          description="Listen to Qur'an recitations, lectures, and nasheeds"
        />
      </div>
    </Layout>
  );
};

export default Audio;
