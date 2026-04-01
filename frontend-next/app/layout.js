import "./globals.css";

export const metadata = {
  title: "MindMate",
  description: "AI-powered student wellness companion"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
