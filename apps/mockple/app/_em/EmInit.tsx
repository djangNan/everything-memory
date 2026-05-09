"use client";

import { useEffect } from "react";

export default function EmInit() {
  useEffect(() => {
    window.EM?.init({
      apiKey: process.env.NEXT_PUBLIC_MOCKPLE_KEY!,
      apiBase: process.env.NEXT_PUBLIC_API_BASE!,
    });
    const email = localStorage.getItem("demo_email");
    if (email) window.EM?.identify(email);
  }, []);
  return null;
}
