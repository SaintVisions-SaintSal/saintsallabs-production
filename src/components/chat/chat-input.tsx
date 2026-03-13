"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-800 p-4 bg-background-dark"
    >
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask SaintSal Intelligence..."
            rows={1}
            disabled={disabled}
            className="w-full bg-card-dark border border-slate-700 rounded-lg px-4 py-3 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-display"
          />
          <button
            type="button"
            className="absolute right-3 bottom-3 text-slate-500 hover:text-primary transition-colors"
            title="Voice input"
          >
            <span className="material-symbols-outlined text-lg">mic</span>
          </button>
        </div>
        <Button
          type="submit"
          disabled={!value.trim() || disabled}
          rounded
          className="h-11 w-11 shrink-0"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </Button>
      </div>
    </form>
  );
}
