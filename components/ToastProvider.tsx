"use client";

// Sonner Toaster wrapper — mounted once at the app root so any client
// component can call toast() and get a bottom-right notification.

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontSize: "13px",
        },
      }}
    />
  );
}
