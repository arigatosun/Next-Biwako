
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-4 sm:pt-6 md:pt-8">
      <Header />
      <main className="flex-grow container mx-auto px-4 mt-6">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;