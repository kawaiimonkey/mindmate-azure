"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ensureUserId, getApiBaseUrl } from "@/lib/mindmate";

const initialMessages = [
  {
    role: "assistant",
    content: "Welcome back. How are you feeling about your workload today? I'm here to listen."
  }
];

export default function ChatPage() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    const nextUserId = ensureUserId();
    const apiBaseUrl = getApiBaseUrl();
    setUserId(nextUserId);
    setStatus(`Connected user: ${nextUserId} | API: ${apiBaseUrl || "not configured"}`);
  }, []);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isSending) return;

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      setIsError(true);
      setStatus("API base URL is not configured yet. Set it before calling the Function App.");
      return;
    }

    const nextConversation = [...conversation, { role: "user", content: text }];
    setMessages((current) => [...current, { role: "user", content: text }]);
    setConversation(nextConversation);
    setInput("");
    setIsSending(true);
    setIsError(false);
    setStatus("MindMate is thinking...");

    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: nextConversation
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details || payload.error || "Chat request failed.");
      }

      const reply =
        payload?.data?.content || "I received the request, but no reply text came back.";

      setConversation((current) => [...current, { role: "assistant", content: reply }]);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setStatus(`Connected user: ${userId} | API: ${apiBaseUrl}`);
    } catch (error) {
      setIsError(true);
      setStatus(`Chat request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="chat-shell app-shell">
      <Sidebar />

      <section className="main-content">
        <div className="chat-container">
          <div className={`status-banner${isError ? " error" : ""}`}>{status}</div>

          <div className="chat-scroll" ref={chatScrollRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`msg-row ${message.role === "user" ? "user" : "bot"}`}
              >
                {message.role !== "user" ? <div className="avatar">M</div> : null}
                <div className="bubble">{message.content}</div>
              </div>
            ))}
          </div>

          <div className="input-wrap">
            <input
              className="text-input"
              type="text"
              value={input}
              placeholder="Type your message here..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="btn-base btn-primary send-btn"
              onClick={() => void sendMessage()}
              disabled={isSending}
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
