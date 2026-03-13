"use client";

import {
  type ReactNode,
  type MouseEvent,
  useCallback,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return <>{children}</>;
}

interface DialogOverlayProps {
  className?: string;
  onClick?: () => void;
}

function DialogOverlay({ className, onClick }: DialogOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        className
      )}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

interface DialogContentProps {
  className?: string;
  children: ReactNode;
  onClose: () => void;
}

function DialogContent({ className, children, onClose }: DialogContentProps) {
  const handleOverlayClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <>
      <DialogOverlay onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        <div
          className={cn(
            "w-full max-w-lg rounded-xl bg-card-dark border border-slate-800 shadow-xl",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </>
  );
}

interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-slate-100 font-display", className)}>
      {children}
    </h2>
  );
}

interface DialogBodyProps {
  className?: string;
  children: ReactNode;
}

function DialogBody({ className, children }: DialogBodyProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogBody };
