# Commerce Image Studio

A local-network friendly Next.js app for batch e-commerce image generation with Gemini.

## Features

- Multi-image upload and batch expansion by type, aspect ratio, resolution, and quantity
- Gemini-powered prompt/copy generation plus image editing
- Pure image output and SVG layout creative output
- SQLite history, retry flow, and LAN-friendly web UI
- Chinese / English interface toggle
- Supports official Gemini and Gemini-compatible relay providers

## Setup

1. Install dependencies:
   - `npm install`
2. Start the production launcher or the dev server:
   - `启动正式版.bat`
   - or `npm run dev -- --hostname 0.0.0.0`
3. Open the app in your browser and configure your provider in Settings.

## Helper Files

- Chinese usage guide: `使用说明-简体中文.md`
- LAN troubleshooting guide: `局域网访问检查清单-简体中文.md`
- Dev launcher: `启动开发版.bat`
- Production launcher: `启动正式版.bat`
- Safe package launcher: `安全打包发布版.bat`
- Safe zip package launcher: `安全打包并生成压缩包.bat`

## Notes

- Generated and source assets are stored under `data/assets` by default.
- The database file is stored at `data/commerce-image-studio.sqlite`.
- For LAN usage, bind the host to `0.0.0.0` or use the provided launchers.
