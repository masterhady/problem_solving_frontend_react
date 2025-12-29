import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || "https://web-production-495dc.up.railway.app/api"}/rag/search/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          similarity_threshold: 0.5,
          top_n: 1,
        }),
      });

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // لو فيه نتائج من API، كل نتيجة رسالة منفصلة
        const botMessages = data.results.map((item) => ({
          sender: "bot",
          text: item.title,
        }));
        setMessages([...newMessages, ...botMessages]);
      } else {
        // لو مفيش نتائج نعرض رسالة واحدة
        setMessages([
          ...newMessages,
          { sender: "bot", text: data.answer || "🤖 No suitable answer found." },
        ]);
      }

    } catch (error) {
      setMessages([
        ...newMessages,
        { sender: "bot", text: "⚠️ Error connecting to the server." },
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="fixed border border-gray-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all"
      style={{
        zIndex: 9999999,
        bottom: "80px",
        right: "30px",
        width: "500px",
        height: "450px",
        backgroundColor: "#b3abc0ff",
        position: "fixed",
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-3 flex justify-between items-center shadow-md">
        <span className="font-semibold text-base">💬 AI Assistant</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-2"
        style={{
          maxHeight: "330px",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {messages.length === 0 && (
          <p className="text-gray-400 text-center text-base mt-20">
            Start the conversation by typing your question 👇
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex mb-2">
            <div
              className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-200 text-gray-900 rounded-bl-none ml-auto"
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center border-t bg-white px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-3 bg-blue-600 text-white text-sm px-5 py-2 rounded-full hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Send size={15} /> Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
