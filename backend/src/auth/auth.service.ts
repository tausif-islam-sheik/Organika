import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(name: string, email: string, password: string, phone?: string) {
    email = email.toLowerCase().trim();
    if (!EMAIL_RE.test(email)) throw new BadRequestException("Invalid email");
    if (!password || password.length < 8) throw new BadRequestException("Password min 8 chars");
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException("Email already registered");
    const user = await this.prisma.user.create({
      data: { name, email, phone, passwordHash: await argon2.hash(password) },
    });
    return this.issuePair(user.id, user.role);
  }

  async login(email: string, password: string, ua?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user?.passwordHash) throw new UnauthorizedException("Invalid email or password");
    if (!(await argon2.verify(user.passwordHash, password)))
      throw new UnauthorizedException("Invalid email or password");
    return this.issuePair(user.id, user.role, ua);
  }

  async loginAdmin(email: string, password: string, ua?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user?.passwordHash) throw new UnauthorizedException("Invalid email or password");
    if (!(await argon2.verify(user.passwordHash, password)))
      throw new UnauthorizedException("Invalid email or password");
    if (!["ADMIN", "MANAGER", "PACKER"].includes(user.role))
      throw new ForbiddenException("Staff only — use customer login");
    return this.issuePair(user.id, user.role, ua);
  }

  async issuePair(userId: string, role: string, ua?: string) {
    const familyId = randomBytes(16).toString("hex");
    const refresh = randomBytes(32).toString("hex");
    const access = await this.jwt.signAsync({ sub: userId, role, sid: familyId });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash(refresh),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 86400e3),
        userAgent: ua,
      },
    });
    return { access, refresh, familyId };
  }

  async refresh(refreshToken: string) {
    const rec = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash(refreshToken) },
      include: { user: true },
    });
    if (!rec || rec.revokedAt || rec.expiresAt < new Date())
      throw new UnauthorizedException("Invalid refresh");
    // Rotation + reuse detection: revoke family, issue new pair
    await this.prisma.refreshToken.updateMany({
      where: { familyId: rec.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return this.issuePair(rec.userId, rec.user.role);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const rec = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: hash(refreshToken) },
      });
      if (rec) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: rec.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }
    return { ok: true };
  }
}
