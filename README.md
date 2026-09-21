# WatermarkPro 🛡️

**WatermarkPro** is a 100% client-side, highly secure, and lightning-fast web application for applying bulk diagonal copyright watermarks to images and videos. Designed for photographers, creators, and studios, it processes everything locally in your browser, ensuring your media never leaves your device.

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/badhonvitality/WatermarkPro)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

⭐ **If you find this project useful, please consider giving it a star on GitHub!** ⭐

---

## ✨ Features

- **100% Client-Side Processing**: No servers, no uploads. Maximum privacy and zero bandwidth costs.
- **Bulk Processing**: Watermark hundreds of images or videos concurrently using Web Workers.
- **Progressive Web App (PWA)**: Installable on desktop/mobile and works completely offline!
- **Dual Watermarking**: Apply Text, Logo, or both simultaneously.
- **Live Interactive Preview**: Instantly see how your watermark looks across your media with split-screen comparison, zoom, and live video playback.
- **Advanced Watermark Styles**: Repeated Diagonal, Cross-Hatch X-Grid, Security Ribbon, Perimeter Frame, and Single Stamp modes.
- **Customization**: Adjust opacity, angle, density, fonts, scaling, and smart center watermarking.
- **Export Formats**: WebP, JPEG, PNG for images; MP4/WebM conversion support.

## 🛠️ Technologies Used

Built with modern web technologies for maximum performance and user experience:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)
- **Processing Engine**: HTML5 Canvas API (OffscreenCanvas with Web Workers)
- **Offline Support**: Custom Service Workers & PWA Manifest
- **Video Processing**: Browser-native canvas capturing & MediaRecorder API
- **State Management**: React Hooks (useState, useCallback, useRef)

## 🚀 Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 👨‍💻 Developed By

**WatermarkPro** is developed and maintained by **[badhonvitality](https://github.com/badhonvitality)**.
Feel free to reach out, open issues, or submit pull requests!

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
