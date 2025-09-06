import React, { useEffect, useRef } from "react";
import Header from "../Header/header.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiClient, createAuthData } from "../../utils/apiClient.js";

const quickQuestions = [
  {
    text: "💼 Lựa chọn nghề nghiệp",
    question: "Tôi nên chọn ngành nghề gì phù hợp với bản thân?",
  },
  {
    text: "📄 Viết CV",
    question: "Làm thế nào để viết CV ấn tượng?",
  },
  {
    text: "🎯 Phỏng vấn",
    question: "Cách chuẩn bị cho buổi phỏng vấn?",
  },
  {
    text: "📈 Xu hướng việc làm",
    question: "Xu hướng việc làm hiện tại như thế nào?",
  },
];

function Chatbot() {
  const { user, isPro, authToken, getAuthToken } = useAuth();
  const messageInputRef = useRef(null);
  const sendButtonRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatFormRef = useRef(null);
  const typingIndicatorRef = useRef(null);
  const statusDotRef = useRef(null);
  const statusTextRef = useRef(null);
  const messageHistory = useRef([]);
  const isTyping = useRef(false);

  useEffect(() => {
    checkSystemStatus();
    setupAutoResize();
    const interval = setInterval(() => checkSystemStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const setupAutoResize = () => {
    const input = messageInputRef.current;
    if (!input) return;
    const resize = () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    };
    input.addEventListener("input", resize);
    resize();
  };

  const checkSystemStatus = async () => {
    try {
      const data = await apiClient.checkStatus();
      updateStatus(
        data.status === "healthy",
        data.status === "healthy" ? "Trực tuyến" : "Đang khởi động..."
      );
    } catch (error) {
      updateStatus(false, "Ngoại tuyến");
      console.error("Status check failed:", error);
    }
  };

  const updateStatus = (isOnline, statusText) => {
    if (statusDotRef.current) {
      statusDotRef.current.classList.toggle("bg-[#2ed573]", isOnline);
      statusDotRef.current.classList.toggle("bg-[#ff4757]", !isOnline);
    }
    if (statusTextRef.current) {
      statusTextRef.current.textContent = statusText;
    }
  };

  const sendMessage = async (messageText = null) => {
    const message = messageText || messageInputRef.current.value.trim();
    if (!message || isTyping.current) return;

    // Kiểm tra authentication
    if (!user) {
      addMessage("Vui lòng đăng nhập để sử dụng chatbot AI.", "bot", {
        type: "error",
      });
      return;
    }

    // Kiểm tra pro status cho các features nâng cao (tùy chọn)
    if (!isPro && message.length > 500) {
      addMessage(
        "Tin nhắn quá dài. Nâng cấp Premium để gửi tin nhắn không giới hạn.",
        "bot",
        {
          type: "error",
        }
      );
      return;
    }

    addMessage(message, "user");
    if (!messageText) {
      messageInputRef.current.value = "";
      messageInputRef.current.style.height = "auto";
    }
    showTyping(true);

    try {
      // Tạo auth data cho API request
      const authData = createAuthData(user, authToken, isPro, getAuthToken);

      // Gọi API thông qua apiClient
      const data = await apiClient.askChatbot(message, authData);

      showTyping(false);
      addMessage(data.response || "Xin lỗi, có lỗi xảy ra.", "bot", data);
    } catch (error) {
      showTyping(false);
      console.error("Chat error:", error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Không thể kết nối đến server. Vui lòng thử lại.";

      if (error.message?.includes("401")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.message?.includes("403")) {
        errorMessage = "Bạn không có quyền sử dụng tính năng này.";
      } else if (error.message?.includes("Gemini API")) {
        errorMessage =
          "⚠️ Hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
      }

      addMessage(errorMessage, "bot", { type: "error" });
    }
    messageInputRef.current?.focus();
  };

  const addMessage = (content, sender, metadata = {}) => {
    const welcomeMessage =
      chatMessagesRef.current?.querySelector(".welcome-message");
    if (welcomeMessage) welcomeMessage.remove();

    const messageDiv = document.createElement("div");
    messageDiv.className = `w-full flex mb-6 ${
      sender === "user" ? "justify-end" : "justify-start"
    }`;

    // Tạo avatar cho bot
    if (sender === "bot") {
      const avatarDiv = document.createElement("div");
      avatarDiv.className = "flex-shrink-0 w-10 h-10 mr-3 mb-2";
      avatarDiv.innerHTML = `
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      `;
      messageDiv.appendChild(avatarDiv);
    }

    const messageContent = document.createElement("div");
    messageContent.className =
      "relative max-w-[85%] md:max-w-[70%] px-5 py-4 rounded-3xl shadow-lg break-words " +
      (sender === "user"
        ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold rounded-br-md border-2 border-blue-400"
        : "bg-white/90 text-blue-900 border-2 border-blue-200 font-normal rounded-bl-md backdrop-blur-sm leading-relaxed");
    if (metadata.type === "error") {
      messageContent.className += " bg-red-500 text-white border-red-400";
    }

    messageContent.innerHTML = formatMessage(content);

    // Tạo avatar cho user (ở bên phải)
    if (sender === "user") {
      const userAvatarDiv = document.createElement("div");
      userAvatarDiv.className = "flex-shrink-0 w-10 h-10 ml-3 mb-2";
      userAvatarDiv.innerHTML = `
        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      `;
      messageDiv.appendChild(messageContent);
      messageDiv.appendChild(userAvatarDiv);
    } else {
      messageDiv.appendChild(messageContent);
    }

    const timestamp = document.createElement("div");
    timestamp.className =
      "hidden text-xs opacity-60 mt-8 absolute right-4 bottom--2";
    timestamp.textContent = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    messageContent.appendChild(timestamp);

    chatMessagesRef.current.appendChild(messageDiv);
    messageHistory.current.push({
      content,
      sender,
      timestamp: new Date(),
      metadata,
    });
    scrollToBottom();
  };

  const formatMessage = (content) => {
    return (
      content
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /`(.*?)`/g,
          '<code class="bg-blue-100 px-2 py-1 rounded text-sm font-mono">$1</code>'
        )
        // Thêm auto line break cho câu dài
        .replace(/(.{80,}?)(\s)/g, "$1<br>$2")
        // Format lists
        .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div class="ml-4 mb-1">$1</div>')
    );
  };

  const showTyping = (show) => {
    isTyping.current = show;
    if (typingIndicatorRef.current)
      typingIndicatorRef.current.style.display = show ? "flex" : "none";
    if (sendButtonRef.current) sendButtonRef.current.disabled = show;
    if (show) scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop =
          chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleQuickQuestion = (question) => sendMessage(question);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      <div className="flex-1 flex flex-col pt-[72px] md:pt-[80px]">
        {/* Header status */}

        {/* Content + Input */}
        <div className="flex-1 flex flex-col min-h-0 justify-between">
          <div
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto px-4 md:px-16 lg:px-32 py-6 custom-scrollbar space-y-4"
            style={{
              scrollBehavior: "smooth",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              maxHeight: "calc(100vh - 165px)",
            }}
          >
            <div className="welcome-message text-center py-8 px-2 md:px-5 text-gray-600 bg-gradient-to-r from-blue-50/30 to-blue-50/50 rounded-lg border-l-4 border-blue-600 shadow mb-6 max-w-2xl mx-auto">
              <h3 className="mb-2 text-lg font-bold text-blue-800">
                👋 Xin chào! Tôi là trợ lý AI tư vấn nghề nghiệp
              </h3>
              <p className="text-blue-600">Tôi có thể giúp bạn về:</p>
              <div className="flex flex-wrap gap-3 justify-center mt-5">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickQuestion(q.question)}
                    className="px-5 py-2 rounded-full border-2 border-blue-500 text-blue-700 font-semibold bg-white shadow transition-all hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white hover:scale-105"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Typing indicator với animation dots và style đẹp hơn */}
            <div
              ref={typingIndicatorRef}
              className="hidden w-full flex justify-start mb-6"
            >
              {/* Bot Avatar */}
              <div className="flex-shrink-0 w-10 h-10 mr-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>

              <div className="relative max-w-[80%] md:max-w-[60%] px-5 py-4 rounded-3xl rounded-bl-md bg-white/80 text-blue-900 border-2 border-blue-200 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-blue-600">
                    Trợ lý đang suy nghĩ...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Input form */}
          <div className="bg-white/80 backdrop-blur border-t border-blue-200 p-3">
            <form
              className="flex gap-2 items-end w-full max-w-2xl mx-auto"
              ref={chatFormRef}
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <textarea
                ref={messageInputRef}
                placeholder="Nhập câu hỏi của bạn..."
                rows={1}
                className="flex-1 resize-none overflow-hidden p-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 transition-all text-base bg-white shadow-sm"
                style={{ maxHeight: 120 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onInput={() => {
                  const input = messageInputRef.current;
                  if (!input) return;
                  input.style.height = "auto";
                  input.style.height = Math.min(input.scrollHeight, 120) + "px";
                }}
              />
              <button
                type="submit"
                ref={sendButtonRef}
                className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Scrollbar CSS */}
      {/* Enhanced scrollbar và text CSS */}
      <style>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.3);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #60a5fa, #3b82f6);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #3b82f6, #2563eb);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Auto text wrapping and formatting */
  .chat-message {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  /* Animation for typing dots */
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
    40% { transform: translateY(-8px); opacity: 1; }
  }
  
  .animate-bounce {
    animation: bounce 1.4s ease-in-out infinite;
  }
`}</style>
    </div>
  );
}

export default Chatbot;
