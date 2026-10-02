import { Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY, ROLES_KEY } from "./decorators";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);
  }
  handleRequest(err: any, user: any, info: any, ctx: ExecutionContext) {
    if (err || !user) {
      const res = ctx.switchToHttp().getResponse();
      // Signal frontend to try refresh once
      res.setHeader("X-Auth-Expired", "1");
      return super.handleRequest(err, user, info, ctx);
    }
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (required?.length && !required.includes(user.role)) {
      const { ForbiddenException } = require("@nestjs/common");
      throw new ForbiddenException("Insufficient role");
    }
    return user;
  }
}
