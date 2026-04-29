import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import sharp from "sharp";
import { storage } from "./storage";
import { execFile, execSync } from "child_process";
import { promises as fs, existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

function findFfmpeg(): string | null {
  const candidates = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/nix/store/bmirb5k0vksybajy1wrfgq9ckgs37q0c-replit-runtime-path/bin/ffmpeg",
  ];

  try {
    const p = execSync("which ffmpeg", { timeout: 3000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
    if (p && existsSync(p)) return p;
  } catch {}

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  return null;
}

const FFMPEG = findFfmpeg();
if (!FFMPEG) {
  console.warn("[warn] ffmpeg not found — audio/video generation will return errors");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Укажите логин и пароль" });
    }
    const user = await storage.validatePassword(username, password);
    if (!user) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }
    req.session.userId = user.id;
    res.json({ ok: true, username: user.username });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    res.json({ username: user.username });
  });

  app.get("/api/articles", async (_req, res) => {
    const list = await storage.getArticles(true);
    res.json(list);
  });

  app.get("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Неверный ID" });
    const article = await storage.getArticle(id);
    if (!article) return res.status(404).json({ message: "Статья не найдена" });
    if (!article.published && !req.session.userId) {
      return res.status(404).json({ message: "Статья не найдена" });
    }
    res.json(article);
  });

  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Укажите URL" });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: "Некорректный URL" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QAHelper/1.0)",
          "Accept": "text/html,application/xhtml+xml,*/*",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `Сервер ответил с кодом ${response.status}` });
      }

      const html = await response.text();
      res.json({ html });
    } catch (e: any) {
      const msg = e.name === "AbortError"
        ? "Превышено время ожидания (15 сек)"
        : `Ошибка загрузки: ${e.message}`;
      res.status(400).json({ message: msg });
    }
  });

  app.get("/api/admin/articles", requireAdmin, async (_req, res) => {
    const list = await storage.getArticles(false);
    res.json(list);
  });

  app.post("/api/admin/articles", requireAdmin, async (req, res) => {
    const { title, content, published } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Укажите заголовок и содержимое" });
    }
    const article = await storage.createArticle({
      title,
      content,
      published: published !== false,
    });
    res.json(article);
  });

  app.put("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Неверный ID" });
    const { title, content, published } = req.body;
    const updated = await storage.updateArticle(id, { title, content, published });
    if (!updated) return res.status(404).json({ message: "Статья не найдена" });
    res.json(updated);
  });

  app.delete("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Неверный ID" });
    const deleted = await storage.deleteArticle(id);
    if (!deleted) return res.status(404).json({ message: "Статья не найдена" });
    res.json({ ok: true });
  });

  app.get("/api/generate/image", async (req, res) => {
    const width = Math.min(4000, Math.max(1, parseInt(req.query.width as string) || 400));
    const height = Math.min(4000, Math.max(1, parseInt(req.query.height as string) || 300));
    const format = (req.query.format as string) || "svg";
    const transparent = req.query.transparent === "true";
    const targetSizeMb = parseFloat(req.query.sizeMb as string) || 0;

    const hue = Math.floor(Math.random() * 360);
    const bgColor = transparent ? "none" : `hsl(${hue}, 40%, 60%)`;
    const borderColor = transparent ? "none" : `hsl(${hue}, 40%, 50%)`;
    const textColor = transparent ? "#333333" : "#ffffff";
    const subTextColor = transparent ? "#666666" : "rgba(255,255,255,0.7)";
    const gridColor = transparent ? "none" : `hsl(${hue}, 40%, 55%)`;

    const fontSize = Math.max(12, Math.min(width, height) / 8);
    const subFontSize = Math.max(10, Math.min(width, height) / 16);

    let gridLines = "";
    if (!transparent) {
      for (let i = 40; i < width; i += 40) {
        gridLines += `<line x1="${i}" y1="0" x2="${i}" y2="${height}" stroke="${gridColor}" stroke-width="0.5" opacity="0.5"/>`;
      }
      for (let j = 40; j < height; j += 40) {
        gridLines += `<line x1="0" y1="${j}" x2="${width}" y2="${j}" stroke="${gridColor}" stroke-width="0.5" opacity="0.5"/>`;
      }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  ${!transparent ? `<rect x="0" y="0" width="${width}" height="4" fill="${borderColor}"/>
  <rect x="0" y="${height - 4}" width="${width}" height="4" fill="${borderColor}"/>
  <rect x="0" y="0" width="4" height="${height}" fill="${borderColor}"/>
  <rect x="${width - 4}" y="0" width="4" height="${height}" fill="${borderColor}"/>` : ""}
  ${gridLines}
  <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${width} x ${height}</text>
  <text x="${width / 2}" y="${height / 2 + fontSize * 0.8}" font-family="Arial, sans-serif" font-size="${subFontSize}" fill="${subTextColor}" text-anchor="middle" dominant-baseline="middle">QA Helper</text>
</svg>`;

    try {
      if (format === "svg") {
        let svgContent = svg;
        if (targetSizeMb > 0) {
          const targetBytes = Math.min(50 * 1024 * 1024, targetSizeMb * 1024 * 1024);
          const currentSize = Buffer.byteLength(svgContent, "utf-8");
          if (targetBytes > currentSize) {
            const padding = targetBytes - currentSize - 50;
            if (padding > 0) {
              const comment = `<!-- ${"X".repeat(Math.min(padding, 50 * 1024 * 1024))} -->`;
              svgContent = svgContent.replace("</svg>", `${comment}\n</svg>`);
            }
          }
        }
        res.set("Content-Type", "image/svg+xml");
        res.set("Content-Disposition", `attachment; filename="image_${width}x${height}.svg"`);
        return res.send(svgContent);
      }

      let sharpInstance = sharp(Buffer.from(svg)).resize(width, height);

      const mimeTypes: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
        tiff: "image/tiff",
        bmp: "image/bmp",
      };

      const ext = format === "jpeg" ? "jpg" : format;
      const contentType = mimeTypes[format] || "image/png";

      let imageBuffer: Buffer;

      if (format === "png") {
        imageBuffer = await sharpInstance.png({ compressionLevel: 0 }).toBuffer();
      } else if (format === "jpg" || format === "jpeg") {
        imageBuffer = await sharpInstance.jpeg({ quality: 95 }).toBuffer();
      } else if (format === "webp") {
        imageBuffer = await sharpInstance.webp({ quality: 95 }).toBuffer();
      } else if (format === "gif") {
        imageBuffer = await sharpInstance.gif().toBuffer();
      } else if (format === "tiff") {
        imageBuffer = await sharpInstance.tiff({ compression: "none" }).toBuffer();
      } else if (format === "bmp") {
        imageBuffer = await sharpInstance.png({ compressionLevel: 0 }).toBuffer();
        res.set("Content-Type", "image/png");
        res.set("Content-Disposition", `attachment; filename="image_${width}x${height}.bmp"`);
      } else {
        imageBuffer = await sharpInstance.png().toBuffer();
      }

      if (targetSizeMb > 0) {
        const targetBytes = Math.min(50 * 1024 * 1024, targetSizeMb * 1024 * 1024);
        if (imageBuffer.length < targetBytes) {
          const padded = Buffer.alloc(targetBytes);
          imageBuffer.copy(padded);
          for (let i = imageBuffer.length; i < targetBytes; i++) {
            padded[i] = Math.floor(Math.random() * 256);
          }
          imageBuffer = padded;
        }
      }

      res.set("Content-Type", format === "bmp" ? "image/png" : contentType);
      res.set("Content-Disposition", `attachment; filename="image_${width}x${height}.${ext}"`);
      res.send(imageBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/generate/broken-image", (req, res) => {
    const type = (req.query.type as string) || "corrupted";

    if (type === "corrupted") {
      const randomBytes = Buffer.alloc(1024);
      for (let i = 0; i < 1024; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
      res.set("Content-Type", "image/png");
      res.set("Content-Disposition", 'attachment; filename="broken.png"');
      res.send(randomBytes);
    } else {
      const textContent = "This is not an image file. It is a plain text file disguised as an image.";
      res.set("Content-Type", "image/png");
      res.set("Content-Disposition", 'attachment; filename="fake_image.png"');
      res.send(Buffer.from(textContent));
    }
  });

  app.get("/api/generate/file", async (req, res) => {
    const type = (req.query.type as string) || "txt";
    const name = (req.query.name as string) || "test_file";
    const content = (req.query.content as string) || "Sample test content";

    if (type === "txt") {
      res.set("Content-Type", "text/plain; charset=utf-8");
      res.set("Content-Disposition", `attachment; filename="${name}.txt"`);
      res.send(content);
    } else if (type === "csv") {
      const csvContent = "id,name,value\n1,test_item_1,100\n2,test_item_2,200\n3,test_item_3,300\n" + content.split("\n").map((line, i) => `${i + 4},"${line}",${Math.floor(Math.random() * 1000)}`).join("\n");
      res.set("Content-Type", "text/csv; charset=utf-8");
      res.set("Content-Disposition", `attachment; filename="${name}.csv"`);
      res.send(csvContent);
    } else if (type === "pdf") {
      const pdfContent = generateSimplePDF(content, name);
      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", `attachment; filename="${name}.pdf"`);
      res.send(pdfContent);
    } else if (type === "docx") {
      const docxContent = await generateSimpleDOCX(content);
      res.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.set("Content-Disposition", `attachment; filename="${name}.docx"`);
      res.send(docxContent);
    } else {
      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="${name}.${type}"`);
      res.send(content);
    }
  });

  app.get("/api/generate/special-file", (req, res) => {
    const variant = (req.query.variant as string) || "empty";
    const sizeMb = Math.min(50, Math.max(1, parseInt(req.query.sizeMb as string) || 1));

    switch (variant) {
      case "empty": {
        res.set("Content-Type", "application/octet-stream");
        res.set("Content-Disposition", 'attachment; filename="empty_file.txt"');
        res.send(Buffer.alloc(0));
        break;
      }
      case "big": {
        const chunkSize = 1024 * 1024;
        const chunk = Buffer.alloc(chunkSize, "A".charCodeAt(0));
        res.set("Content-Type", "application/octet-stream");
        res.set("Content-Disposition", `attachment; filename="large_${sizeMb}mb.bin"`);
        res.set("Content-Length", String(sizeMb * chunkSize));
        for (let i = 0; i < sizeMb; i++) {
          res.write(chunk);
        }
        res.end();
        break;
      }
      case "long_name": {
        const longName = "a".repeat(200) + ".txt";
        res.set("Content-Type", "text/plain");
        res.set("Content-Disposition", `attachment; filename="${longName}"`);
        res.send("File with a very long name for testing filename length limits.");
        break;
      }
      case "cyrillic_name": {
        const cyrName = "тестовый_файл_кириллица_данные.txt";
        res.set("Content-Type", "text/plain; charset=utf-8");
        res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(cyrName)}`);
        res.send("Файл с кириллическим именем для тестирования.");
        break;
      }
      case "special_chars": {
        const specialName = "file [test] (1) @#$%.txt";
        res.set("Content-Type", "text/plain");
        res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(specialName)}`);
        res.send("File with special characters in name.");
        break;
      }
      case "wrong_mime": {
        res.set("Content-Type", "image/jpeg");
        res.set("Content-Disposition", 'attachment; filename="not_really_image.jpg"');
        res.send("This is plain text but served as image/jpeg MIME type.");
        break;
      }
      default: {
        res.status(400).json({ error: "Unknown variant" });
      }
    }
  });

  app.get("/api/generate/audio", async (req, res) => {
    if (!FFMPEG) {
      return res.status(503).json({ message: "ffmpeg не установлен на сервере. Генерация аудио недоступна." });
    }
    const format = (req.query.format as string) || "wav";
    const sizeMb = Math.min(50, Math.max(0.1, parseFloat(req.query.sizeMb as string) || 1));
    const duration = Math.min(300, Math.max(1, parseInt(req.query.duration as string) || 5));

    const allowedFormats = ["wav", "mp3", "ogg", "flac", "aac", "m4a", "wma"];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ message: `Неподдерживаемый формат. Доступные: ${allowedFormats.join(", ")}` });
    }

    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `audio_${crypto.randomUUID()}.${format}`);

    try {
      const ffmpegArgs: string[] = [
        "-y",
        "-f", "lavfi",
        "-i", `sine=frequency=440:duration=${duration}`,
      ];

      if (format === "mp3") {
        ffmpegArgs.push("-codec:a", "libmp3lame", "-b:a", "128k");
      } else if (format === "ogg") {
        ffmpegArgs.push("-codec:a", "libvorbis", "-b:a", "128k");
      } else if (format === "flac") {
        ffmpegArgs.push("-codec:a", "flac");
      } else if (format === "aac" || format === "m4a") {
        ffmpegArgs.push("-codec:a", "aac", "-b:a", "128k");
      } else if (format === "wma") {
        ffmpegArgs.push("-codec:a", "wmav2", "-b:a", "128k");
      } else {
        ffmpegArgs.push("-codec:a", "pcm_s16le");
      }

      ffmpegArgs.push(tmpFile);

      await new Promise<void>((resolve, reject) => {
        execFile(FFMPEG, ffmpegArgs, { timeout: 30000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      let fileData = await fs.readFile(tmpFile);

      const targetBytes = Math.round(sizeMb * 1024 * 1024);
      if (targetBytes > fileData.length) {
        const padded = Buffer.alloc(targetBytes);
        fileData.copy(padded);
        for (let i = fileData.length; i < targetBytes; i++) {
          padded[i] = 0;
        }
        fileData = padded;
      } else if (targetBytes < fileData.length && sizeMb < 50) {
        fileData = fileData.subarray(0, targetBytes);
      }

      const mimeTypes: Record<string, string> = {
        wav: "audio/wav",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        flac: "audio/flac",
        aac: "audio/aac",
        m4a: "audio/mp4",
        wma: "audio/x-ms-wma",
      };

      const outputFormat = format === "m4a" ? "m4a" : format;
      res.set("Content-Type", mimeTypes[format] || "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="test_audio_${duration}s.${outputFormat}"`);
      res.send(fileData);
    } catch (e: any) {
      res.status(500).json({ message: `Ошибка генерации аудио: ${e.message}` });
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }
  });

  app.get("/api/generate/video", async (req, res) => {
    if (!FFMPEG) {
      return res.status(503).json({ message: "ffmpeg не установлен на сервере. Генерация видео недоступна." });
    }
    const format = (req.query.format as string) || "mp4";
    const sizeMb = Math.min(50, Math.max(0.1, parseFloat(req.query.sizeMb as string) || 1));
    const duration = Math.min(60, Math.max(1, parseInt(req.query.duration as string) || 3));
    const width = Math.min(1920, Math.max(64, parseInt(req.query.width as string) || 640));
    const height = Math.min(1080, Math.max(64, parseInt(req.query.height as string) || 480));

    const allowedFormats = ["mp4", "avi", "webm", "mkv", "mov", "wmv"];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ message: `Неподдерживаемый формат. Доступные: ${allowedFormats.join(", ")}` });
    }

    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `video_${crypto.randomUUID()}.${format}`);

    try {
      const ffmpegArgs: string[] = [
        "-y",
        "-f", "lavfi",
        "-i", `testsrc=duration=${duration}:size=${width}x${height}:rate=24`,
        "-f", "lavfi",
        "-i", `sine=frequency=440:duration=${duration}`,
        "-shortest",
      ];

      if (format === "mp4") {
        ffmpegArgs.push("-codec:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-codec:a", "aac", "-b:a", "96k");
      } else if (format === "avi") {
        ffmpegArgs.push("-codec:v", "mpeg4", "-codec:a", "mp3", "-b:a", "96k");
      } else if (format === "webm") {
        ffmpegArgs.push("-codec:v", "libvpx", "-codec:a", "libvorbis", "-b:a", "96k");
      } else if (format === "mkv") {
        ffmpegArgs.push("-codec:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-codec:a", "aac", "-b:a", "96k");
      } else if (format === "mov") {
        ffmpegArgs.push("-codec:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-codec:a", "aac", "-b:a", "96k");
      } else if (format === "wmv") {
        ffmpegArgs.push("-codec:v", "wmv2", "-codec:a", "wmav2", "-b:a", "96k");
      }

      ffmpegArgs.push(tmpFile);

      await new Promise<void>((resolve, reject) => {
        execFile(FFMPEG, ffmpegArgs, { timeout: 60000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      let fileData = await fs.readFile(tmpFile);

      const targetBytes = Math.round(sizeMb * 1024 * 1024);
      if (targetBytes > fileData.length) {
        const padded = Buffer.alloc(targetBytes);
        fileData.copy(padded);
        for (let i = fileData.length; i < targetBytes; i++) {
          padded[i] = 0;
        }
        fileData = padded;
      } else if (targetBytes < fileData.length && sizeMb < 50) {
        fileData = fileData.subarray(0, targetBytes);
      }

      const mimeTypes: Record<string, string> = {
        mp4: "video/mp4",
        avi: "video/x-msvideo",
        webm: "video/webm",
        mkv: "video/x-matroska",
        mov: "video/quicktime",
        wmv: "video/x-ms-wmv",
      };

      res.set("Content-Type", mimeTypes[format] || "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename="test_video_${duration}s_${width}x${height}.${format}"`);
      res.send(fileData);
    } catch (e: any) {
      res.status(500).json({ message: `Ошибка генерации видео: ${e.message}` });
    } finally {
      fs.unlink(tmpFile).catch(() => {});
    }
  });

  app.get("/api/mock", async (req, res) => {
    const status = parseInt(req.query.status as string) || 200;
    const delay = Math.min(30000, Math.max(0, parseInt(req.query.delay as string) || 0));

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const bodies: Record<number, object> = {
      200: { status: "ok", message: "Success", data: { id: 1, timestamp: new Date().toISOString() } },
      201: { status: "created", message: "Resource created successfully", id: Math.floor(Math.random() * 10000) },
      400: { status: "error", message: "Bad Request: Invalid input data", errors: [{ field: "email", message: "Invalid email format" }] },
      401: { status: "error", message: "Unauthorized: Authentication required", code: "AUTH_REQUIRED" },
      403: { status: "error", message: "Forbidden: Insufficient permissions", code: "FORBIDDEN" },
      404: { status: "error", message: "Not Found: Resource does not exist", code: "NOT_FOUND" },
      500: { status: "error", message: "Internal Server Error", code: "INTERNAL_ERROR", trace: "Error at line 42" },
    };

    const body = bodies[status] || { status: "unknown", code: status };
    res.status(status).json(body);
  });

  return httpServer;
}

function generateSimplePDF(content: string, title: string): Buffer {
  const lines = content.split("\n");
  const textObjects = lines.map((line, i) => {
    const y = 750 - i * 20;
    return `BT /F1 12 Tf ${50} ${y} Td (${escPdfStr(line)}) Tj ET`;
  }).join("\n");

  const titleObj = `BT /F1 18 Tf 50 780 Td (${escPdfStr(title)}) Tj ET`;

  const stream = `${titleObj}\n${textObjects}`;
  const streamLen = Buffer.byteLength(stream);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${streamLen} >>
stream
${stream}
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000${(streamLen + 320).toString().padStart(3, "0")} 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

  return Buffer.from(pdf);
}

function escPdfStr(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

async function generateSimpleDOCX(content: string): Promise<Buffer> {
  const JSZip = require("jszip");
  const zip = new JSZip();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const escapedContent = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = escapedContent.split("\n").map(line => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join("");

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}</w:body>
</w:document>`;

  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("word/document.xml", document);

  return await zip.generateAsync({ type: "nodebuffer" });
}
