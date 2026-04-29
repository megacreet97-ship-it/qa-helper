# QA Helper — Test Data Generator Toolkit

## Overview
QA Helper is a web-based toolkit for QA engineers that generates test data, files, images, and security payloads for manual and API testing. Includes an admin panel for managing educational articles/guides.

## Architecture
- **Frontend**: React + Vite + TypeScript with Shadcn UI components
- **Backend**: Express.js (Node.js) for file/image generation, mock API endpoints, and admin CMS
- **Database**: PostgreSQL (Neon-backed) for users and articles
- **Auth**: express-session + connect-pg-simple, bcrypt for password hashing
- **Routing**: wouter for client-side routing

## Project Structure
```
client/src/
  components/
    app-sidebar.tsx     - Sidebar navigation
    theme-provider.tsx  - Dark/light theme context
    theme-toggle.tsx    - Theme toggle button
    copy-button.tsx     - Copy-to-clipboard button
    result-display.tsx  - Results list with copy/export
  pages/
    personal-data.tsx   - SNILS, FIO, dates, phones, emails, UUID generators
    text-generators.tsx - Text by length (incl. meaningful RU/EN), Lorem Ipsum, Unicode, SQL/XSS payloads
    text-compare.tsx    - Side-by-side text diff with char-level highlighting
    image-generators.tsx- Placeholder images, broken files
    file-generators.tsx - TXT, CSV, PDF, DOCX, special files
    media-generators.tsx- Audio (WAV/MP3/OGG/FLAC/AAC/M4A/WMA) and video (MP4/AVI/WebM/MKV/MOV/WMV)
    api-helpers.tsx     - JSON generator, mock API, HTTP headers
    jwt-decoder.tsx     - Client-side JWT token decoder
    security-helpers.tsx- Security payloads (SQL, XSS, path traversal, null/empty, long strings)
    guides.tsx          - Public page for viewing educational articles
    admin-login.tsx     - Admin login page
    admin-panel.tsx     - Admin CMS for managing articles
    json-validator.tsx  - Client-side JSON syntax validator with formatting
    html-compare.tsx    - Structural HTML comparison tool
  lib/
    generators.ts       - All data generation logic (client-side)

server/
  db.ts                 - PostgreSQL connection pool and Drizzle ORM instance
  storage.ts            - Database storage interface and implementation
  routes.ts             - API endpoints for generation, mock API, auth, and articles CRUD
  index.ts              - Express server setup with session middleware

shared/
  schema.ts             - Drizzle schema for users and articles tables
```

## Key Features
1. **Personal Data**: SNILS, FIO, birth dates, phones, emails, UUID
2. **Text**: By character count (+ meaningful RU/EN), Lorem Ipsum, Unicode/emoji, SQL injection, XSS
2a. **Text Compare**: Side-by-side diff with char-level highlighting, whitespace toggle
3. **Images**: SVG/PNG/JPEG/WebP/GIF/TIFF placeholder images, broken/corrupted files
4. **Files**: TXT, CSV, PDF, DOCX + special files (empty, large, long names, etc.)
4a. **Audio**: WAV, MP3, OGG, FLAC, AAC, M4A, WMA with configurable duration and size (ffmpeg)
4b. **Video**: MP4, AVI, WebM, MKV, MOV, WMV with configurable resolution, duration, and size (ffmpeg)
5. **API Helpers**: JSON generator, mock endpoints with status codes/delays, HTTP headers
6. **JWT Decoder**: Client-side JWT token parsing with Russian annotations
7. **Security**: SQL injection, XSS, path traversal, null/empty values, long strings
8. **Guides/Training**: Public page for educational articles, managed via admin panel
9. **Admin Panel**: Single admin account (admin), article CMS with create/edit/delete/publish
10. **JSON Validator**: Client-side syntax validation, error highlighting, formatting, minification, stats, suspicious values
11. **HTML Compare**: File upload (.html) + URL fetch for landing, structural DOM comparison, attribute/style/text diffs, match percentage, responsive hints

## API Routes
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Check admin session
- `GET /api/articles` - List published articles (public)
- `GET /api/articles/:id` - Get single article (public, published only)
- `GET /api/admin/articles` - List all articles (admin only)
- `POST /api/admin/articles` - Create article (admin only)
- `PUT /api/admin/articles/:id` - Update article (admin only)
- `DELETE /api/admin/articles/:id` - Delete article (admin only)
- `GET /api/generate/image?width=&height=&format=&transparent=&sizeMb=` - Generate placeholder image
- `GET /api/generate/broken-image?type=corrupted|wrong_mime` - Generate broken image files
- `GET /api/generate/file?type=txt|csv|pdf|docx&name=&content=` - Generate document files
- `GET /api/generate/special-file?variant=empty|big|long_name|cyrillic_name|special_chars|wrong_mime&sizeMb=` - Special test files
- `GET /api/generate/audio?format=wav|mp3|ogg|flac|aac|m4a|wma&duration=5&sizeMb=1` - Generate audio files
- `GET /api/generate/video?format=mp4|avi|webm|mkv|mov|wmv&duration=3&sizeMb=1&width=640&height=480` - Generate video files
- `POST /api/fetch-url` - Fetch HTML from external URL (for HTML compare)
- `GET /api/mock?status=200|400|401|403|404|500&delay=0` - Mock API endpoint

## User Preferences
- Interface language: Russian (all UI text in Russian)
- Design style: Modern, clean with indigo/violet color scheme

## Recent Changes
- 2026-03-01: Added audio and video generation (/media) with ffmpeg
- 2026-03-01: Updated HTML Compare with file upload and URL fetch instead of two textareas
- 2026-03-01: Added JSON Validator (/json-validator) and HTML Compare (/html-compare) tools
- 2026-02-06: Added admin panel with login, article CMS, and public guides page
- 2026-02-06: Added text comparison tool with side-by-side diff, char-level highlighting, whitespace visibility
- 2026-02-06: Added meaningful text generation (RU/EN word banks) to text generator
- 2026-02-06: Full Russian localization of all pages, sidebar, and components
- 2026-02-06: Updated color scheme to indigo/violet (hue 250) with improved shadows
- 2026-02-06: Initial implementation of QA Helper with all 6 generator sections
