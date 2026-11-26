"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export interface ToastState {
  message: string;
  type?: "success" | "error";
}

export function ToastBanner({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const isError = toast.type === "error";
  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border ${
          isError
            ? "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
            : "bg-[#0F172A] border-[#1E293B] text-white"
        }`}
      >
        {isError ? (
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        ) : (
          <CheckCircle2
            className="w-4 h-4 shrink-0 text-[#7DD3FC]"
            strokeWidth={1.75}
          />
        )}
        <span className="text-[13px] font-medium flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="opacity-70 hover:opacity-100 p-0.5"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
