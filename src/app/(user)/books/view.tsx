'use client';

import { ContentBrowser } from "@/components/content/ContentBrowser";

export const BooksView = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContentBrowser
        contentType="book"
        title="اسلامی کتب"
        description="مستند اسلامی کتب اور علمی متون کا ہمارا مجموعہ دیکھیں۔"
      />
    </div>
  );
};
