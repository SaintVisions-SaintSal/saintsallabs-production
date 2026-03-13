"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types/project";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
}

export function ChatPanel({ messages, onSendMessage, isGenerating }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-slate-800">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-800 shrink-0">
        <span className="material-symbols-outlined text-primary text-lg">chat</span>
        <span className="text-sm font-display font-medium text-slate-200">Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span
              className="material-symbols-outlined text-primary text-3xl mb-3"
              style={{ filter: "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))" }}
            >
              code
            </span>
            <p className="text-sm text-slate-400 font-display">
              Describe what you want to build
            </p>
            <p className="text-xs text-slate-500 mt-1">
              e.g. &quot;Build a todo app with dark mode&quot;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary/10 text-slate-100 border border-primary/20"
                  : "bg-card-dark text-slate-300 border border-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-card-dark border border-slate-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-slate-400">Generating...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to build..."
            rows={1}
            className="flex-1 bg-card-dark border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-display"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isGenerating}
            className="shrink-0"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
