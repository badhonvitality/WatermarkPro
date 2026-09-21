import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bulk Image Watermark Tool | WatermarkPro",
  description:
    "Add text watermarks to hundreds of images at once. Fast, private and easy to use. 100% client-side local browser processing with diagonal repeat coverage.",
  keywords: [
    "watermark",
    "bulk watermark",
    "image watermark",
    "text watermark",
    "diagonal watermark",
    "copyright watermark",
    "batch watermark",
    "WatermarkPro",
    "client-side watermark",
  ],
  authors: [{ name: "WatermarkPro" }],
  creator: "WatermarkPro",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://watermarkpro.app",
    title: "Bulk Image Watermark Tool | WatermarkPro",
    description:
      "Protect hundreds of images with custom diagonal text watermarks in seconds. Zero cloud uploads.",
    siteName: "WatermarkPro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bulk Image Watermark Tool | WatermarkPro",
    description: "Protect hundreds of images with custom text watermarks in seconds.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0b0f19] text-slate-100 min-h-screen">
        {children}
        {/* Enhanced Service Worker registration for 100% offline & CSS caching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[WatermarkPro] Offline Service Worker registered:', reg.scope);
                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('[WatermarkPro] New offline version available, activating...');
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          });
                        }
                      });
                    })
                    .catch(function(err) {
                      console.warn('[WatermarkPro] Service Worker registration failed:', err);
                    });

                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!refreshing) {
                      refreshing = true;
                      console.log('[WatermarkPro] Offline controller active.');
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
