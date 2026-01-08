"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/useTripStore";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type PlaceChatAssistantProps = {
  userLocation?: { lat: number; lng: number } | null;
};

export function PlaceChatAssistant({ userLocation }: PlaceChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của Vivu Go. Tôi có thể giúp bạn tư vấn về các địa điểm du lịch, nhà hàng, điểm tham quan và lịch trình. Bạn muốn hỏi gì?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { trip } = useTripStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context from trip data
      const context = {
        tripName: trip.name,
        days: trip.days.map((day) => ({
          date: day.date,
          places: day.places.map((place) => ({
            name: place.name,
            category: place.category,
          })),
        })),
        location: userLocation || null,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Không nhận được phản hồi từ AI.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorContent = "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.";
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes("api key") || errorMsg.includes("gemini api key")) {
          errorContent = "⚠️ Lỗi cấu hình: Chưa thiết lập GEMINI_API_KEY. Vui lòng thêm API key vào file .env.local và khởi động lại server.";
        } else if (errorMsg.includes("quota") || errorMsg.includes("limit")) {
          errorContent = "⚠️ Đã vượt quá giới hạn sử dụng API. Vui lòng kiểm tra quota của Gemini API.";
        } else {
          errorContent = `⚠️ Lỗi: ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Function to parse and render markdown-like text
  const renderMarkdown = (text: string) => {
    const elements: (string | React.ReactElement)[] = [];
    let key = 0;

    // Process text with multiple patterns
    const patterns = [
      {
        // Bold text: **text**
        regex: /\*\*([^*]+)\*\*/g,
        render: (content: string) => (
          <strong key={`bold-${key++}`} className="font-semibold">
            {content}
          </strong>
        ),
      },
      {
        // Dates: DD/MM/YYYY or DD-MM-YYYY
        regex: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
        render: (date: string) => (
          <span key={`date-${key++}`} className="font-semibold text-primary">
            {date}
          </span>
        ),
      },
      {
        // Italic: *text* (but not **text**)
        regex: /(?<!\*)\*([^*]+)\*(?!\*)/g,
        render: (content: string) => (
          <em key={`italic-${key++}`} className="italic">
            {content}
          </em>
        ),
      },
    ];

    // Find all matches with their positions
    const matches: Array<{
      start: number;
      end: number;
      element: React.ReactElement;
      patternIndex: number;
    }> = [];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          element: pattern.render(match[1] || match[0]),
          patternIndex,
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first one)
    const nonOverlapping: typeof matches = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const overlaps = nonOverlapping.some(
        (m) => !(current.end <= m.start || current.start >= m.end)
      );
      if (!overlaps) {
        nonOverlapping.push(current);
      }
    }

    // Build final elements
    let lastIndex = 0;
    nonOverlapping.forEach((match) => {
      // Add text before match
      if (match.start > lastIndex) {
        elements.push(text.slice(lastIndex, match.start));
      }
      // Add formatted element
      elements.push(match.element);
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements.length > 0 ? <>{elements}</> : text;
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
              aria-label="Mở chat AI"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col rounded-lg border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Trợ lý AI Vivu Go</h3>
                  <p className="text-xs text-muted-foreground">
                    Tư vấn địa điểm & du lịch
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap wrap-break-words">
                      {message.role === "assistant" 
                        ? renderMarkdown(message.content)
                        : message.content
                      }
                    </div>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Nhấn Enter để gửi
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

