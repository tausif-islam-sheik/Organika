import { Controller, Post, Get, Body, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "./decorators";
import { JwtAuthGuard } from "./jwt-auth.guard";

const ACCESS_MS = 15 * 60 * 1000;
const REFRESH_MS = 7 * 86400 * 1000;

function setCookies(res: Response, access: string, refresh: string) {
  res.cookie("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_MS,
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: REFRESH_MS,
  });
}

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post("register")
  async register(
    @Body() b: { name: string; email: string; password: string; phone?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const p = await this.auth.register(b.name, b.email, b.password, b.phone);
    setCookies(res, p.access, p.refresh);
    return { ok: true };
  }

  @Public()
  @Post("login")
  async login(
    @Body() b: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const p = await this.auth.login(b.email, b.password, req.headers["user-agent"]);
    setCookies(res, p.access, p.refresh);
    return { ok: true };
  }

  @Public()
  @Post("admin/login")
  async adminLogin(
    @Body() b: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const p = await this.auth.loginAdmin(b.email, b.password, req.headers["user-agent"]);
    setCookies(res, p.access, p.refresh);
    return { ok: true };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = req.cookies?.refresh_token;
    const p = await this.auth.refresh(rt);
    setCookies(res, p.access, p.refresh);
    return { ok: true };
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() b: { email: string }) {
    return this.auth.forgotPassword(b.email ?? "");
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() b: { token: string; password: string }) {
    return this.auth.resetPassword(b.token ?? "", b.password ?? "");
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.refresh_token);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/auth/refresh" });
    return { ok: true };
  }

  @Get("me")
  me(@Req() req: any) {
    return req.user;
  }
}
