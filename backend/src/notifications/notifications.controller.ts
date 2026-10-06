import { Controller, Get, Patch, Param, Query, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin/notifications")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN", "MANAGER", "PACKER")
export class NotificationsController {
  constructor(private notes: NotificationsService) {}

  @Get()
  list(@Query("unread") unread?: string, @Query("take") take?: string) {
    return this.notes.list({ unreadOnly: unread === "1" || unread === "true", take: Number(take) || 50 });
  }

  @Get("unread-count")
  unreadCount() {
    return this.notes.unreadCount();
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notes.markRead(id);
  }

  @Patch("read-all")
  markAllRead() {
    return this.notes.markAllRead();
  }
}
