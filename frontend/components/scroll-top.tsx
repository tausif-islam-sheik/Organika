"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollTop() {
  const path = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [path]);
  return null;
}
