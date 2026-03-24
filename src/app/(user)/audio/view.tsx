'use client';

import { ContentBrowser } from "@/components/content/ContentBrowser";

export const AudioView = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContentBrowser
        contentType="audio"
        title="آڈیو لائبریری"
        description="مختلف علماء کے بصیرت افروز خطبات، سلسلے اور قرآنی تلاوت سنیں۔"
      />
    </div>
  );
};
