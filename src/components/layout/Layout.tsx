import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { UploadProgress } from "./UploadProgress";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
      <UploadProgress />
    </div>
  );
};

export default Layout;
