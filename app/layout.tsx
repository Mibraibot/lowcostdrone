import "./globals.css";
import Header from "@/components/layout/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white" style={{ backgroundColor: "#111625" }}>
  <Header />
  <main>{children}</main>
</body>

    </html>
  );
}
