import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "@/lib/StoreProvider";
import { FetchInterceptor } from "./components/FetchInterceptor";
import { ConditionalLayout } from "./components/ConditionalLayout";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "LIYT - The Future of Delivery",
  description: "Payy is a stablecoin-native banking platform with unrivaled privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#0a0a0a]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StoreProvider>
            <FetchInterceptor>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </FetchInterceptor>
          </StoreProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
