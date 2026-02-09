import Layout from "@/components/layout/Layout";
import { ContentBrowser } from "@/components/content/ContentBrowser";

const Books = () => {
  return (
    <Layout>
       <div className="container mx-auto px-4 py-8">
        <ContentBrowser 
          contentType="book"
          title="Books Library"
          description="Browse our collection of Islamic books and PDFs"
        />
      </div>
    </Layout>
  );
};

export default Books;
