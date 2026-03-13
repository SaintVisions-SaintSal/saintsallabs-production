"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types/project";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <span
            className="material-symbols-outlined text-primary text-5xl mb-4 inline-block"
            style={{ filter: "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))" }}
          >
            psychology
          </span>
          <h2 className="text-xl font-bold font-display text-slate-100 mb-2">
            SaintSal Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Ask anything. I can help with research, code, analysis, and more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
        >
          {msg.role === "assistant" && (
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">
                psychology
              </span>
            </div>
          )}

          <div
            className={`max-w-2xl ${
              msg.role === "user"
                ? "bg-primary/10 border border-primary/20 rounded-lg px-4 py-3"
                : ""
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-card-dark [&_pre]:border [&_pre]:border-slate-800 [&_pre]:rounded-lg">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-slate-100">{msg.content}</p>
            )}
          </div>

          {msg.role === "user" && (
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-300 text-sm">
                person
              </span>
            </div>
          )}
        </div>
      ))}

      {isStreaming && (
        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">
              psychology
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
