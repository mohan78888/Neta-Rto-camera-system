import './globals.css';

export const metadata = {
  title: 'Netra CCTV | Smart AI Surveillance & Command Center',
  description: 'Centralized Smart AI CCTV monitoring, video analytics, and real-time alert command platform.',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-slate-100 min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
