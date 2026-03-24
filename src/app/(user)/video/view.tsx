'use client';

import { ContentBrowser } from "@/components/content/ContentBrowser";

export const VideoView = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContentBrowser
        contentType="video"
        title="ویڈیو ذخیرہ"
        description="اسلامی تعلیمات پر مبنی تعلیمی ویڈیوز، دستاویزی فلمیں اور لائیو نشستیں دیکھیں۔"
      />
    </div>
  );
};
