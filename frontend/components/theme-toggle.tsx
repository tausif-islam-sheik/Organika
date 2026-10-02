"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("organika-theme");
    const isDark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("organika-theme", next ? "dark" : "light");
  };

  if (!mounted) return <Button variant="outline" size="icon" disabled><Sun /></Button>;
  return (
    <Button variant="outline" size="icon" onClick={toggle} title={dark ? "Light mode" : "Dark mode"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
