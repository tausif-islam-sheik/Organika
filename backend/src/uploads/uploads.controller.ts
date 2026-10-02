import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const ROOT = join(__dirname, "..", "..", "uploads");

function destFor(mimetype: string) {
  const kind = mimetype.startsWith("image/") ? "images" : mimetype.startsWith("video/") ? "videos" : "files";
  const dir = join(ROOT, kind);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

@Controller("admin/upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Roles("ADMIN", "MANAGER")
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, file, cb) => cb(null, destFor(file.mimetype)),
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file");
    const kind = file.mimetype.startsWith("image/")
      ? "images"
      : file.mimetype.startsWith("video/")
        ? "videos"
        : "files";
    return { url: `/uploads/${kind}/${file.filename}`, mimetype: file.mimetype, size: file.size };
  }
}
