import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WatermarkPro - Bulk Image Watermark Tool",
    short_name: "WatermarkPro",
    description: "Add text watermarks to hundreds of images at once in your browser.",
    start_url: "/watermark",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
