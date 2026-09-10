"use client";

/* The single toast host, mounted once by the page shell. Anything
   anywhere can call `pushToast`; only this renders one. */

import { useSyncExternalStore } from "react";
import Toasts from "./ui/Toast";
import { dismissToast, getToasts, subscribeToasts } from "@/lib/market/toastBus";

const NONE: ReturnType<typeof getToasts> = [];
const server = () => NONE;

export default function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, server);
  return <Toasts toasts={toasts} onDismiss={dismissToast} />;
}
