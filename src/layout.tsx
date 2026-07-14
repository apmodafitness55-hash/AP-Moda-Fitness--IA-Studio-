import React from 'react';

// Global application layout metadata for SEO, Favicon and Brand mappings
export const metadata = {
  title: "AP Moda Fitness",
  description: "Peças de alta tecnologia e caimento perfeito",
  icons: {
    icon: [
      {
        url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=128&h=128&fit=crop&q=80",
        sizes: "128x128",
        type: "image/png"
      },
      {
        url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=48&h=48&fit=crop&q=80",
        sizes: "48x48",
        type: "image/png"
      }
    ],
    apple: [
      {
        url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=180&h=180&fit=crop&q=80",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-root min-h-screen">
      {children}
    </div>
  );
}
