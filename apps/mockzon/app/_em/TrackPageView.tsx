"use client";

import { useEffect } from "react";

export default function TrackPageView() {
  useEffect(() => {
    window.EM?.track("page_view");
  }, []);
  return null;
}
