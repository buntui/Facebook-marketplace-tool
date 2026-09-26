import "./globals.css";

export const metadata = {
  title: "Marketplace Finder",
  description: "Search and score real marketplace listings"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
