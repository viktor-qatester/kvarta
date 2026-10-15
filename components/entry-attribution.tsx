"use client";

import { useEffect } from "react";
import { captureEntryAttribution } from "@/lib/attribution";

export function EntryAttribution() {
  useEffect(() => {
    captureEntryAttribution();
  }, []);
  return null;
}
