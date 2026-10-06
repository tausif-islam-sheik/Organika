"use client";

import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return <Sonner richColors position="top-right" closeButton />;
}

export { toast };
