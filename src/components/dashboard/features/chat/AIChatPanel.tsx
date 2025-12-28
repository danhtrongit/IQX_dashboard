import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Send, Loader2, Database, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ChatAPI,
    type ChatMessage,
    createUserMessage,
    createAssistantMessage,
    createLoadingMessage,
    formatMessageTime,
} from "@/lib/chat-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Welcome message from Mr.Arix
const WELCOME_MESSAGE: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: `Xin chào! Tôi là **Mr.Arix** - Chuyên gia thông tin chứng khoán IQX.

Tôi có thể hỗ trợ bạn về:
- 📈 Giá cổ phiếu realtime
- 🏢 Thông tin công ty
- 📊 Báo cáo tài chính & chỉ số
- 📰 Tin tức và sự kiện

Hãy đặt câu hỏi!`,
    timestamp: new Date(),
};

export function AIChatPanel() {
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSendMessage = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        setError(null);
        setInputValue("");

        const userMessage = createUserMessage(trimmedInput);
        setMessages((prev) => [...prev, userMessage]);

        const loadingMsg = createLoadingMessage();
        setMessages((prev) => [...prev, loadingMsg]);
        setIsLoading(true);

        try {
            const response = await ChatAPI.sendMessage(trimmedInput, conversationId);

            if (response.conversation_id) {
                setConversationId(response.conversation_id);
            }

            const assistantMessage = createAssistantMessage(response);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingMsg.id ? assistantMessage : msg
                )
            );
        } catch (err) {
            console.error("Chat error:", err);
            setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsg.id));
            setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([WELCOME_MESSAGE]);
        setConversationId(null);
        setError(null);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 absolute -bottom-0 -right-0 z-10" />
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <BotIcon className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold">Mr.Arix</span>
                        <span className="text-[10px] text-muted-foreground">AI Assistant</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleClearChat}
                    title="Xóa cuộc trò chuyện"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                    <ChatMessageBubble key={message.id} message={message} />
                ))}

                {error && (
                    <div className="flex justify-center">
                        <div className="bg-destructive/10 text-destructive text-[10px] px-2 py-1.5 rounded-lg">
                            {error}
                            <button
                                className="ml-2 underline hover:no-underline"
                                onClick={() => setError(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-2 py-1.5 border-t border-border/30">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {["Giá VNM?", "Top tăng", "Khối ngoại"].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setInputValue(suggestion);
                                inputRef.current?.focus();
                            }}
                            className="text-[9px] px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-2 border-t border-border/40">
                <div className="flex items-center gap-1.5 bg-secondary/30 rounded-full px-1 py-0.5 border border-transparent focus-within:border-primary/50 transition-colors">
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/50 h-7 pl-2.5"
                        placeholder="Hỏi Mr.Arix..."
                    />
                    <Button
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Send className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";
    const [showSources, setShowSources] = useState(false);

    if (message.isStreaming) {
        return (
            <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                </div>
                <div className="bg-muted p-2 rounded-xl rounded-tl-none text-[11px] max-w-[85%]">
                    <span className="text-muted-foreground">Đang xử lý</span>
                    <span className="animate-pulse ml-1">...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
            <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                    isUser ? "bg-blue-500/20 text-blue-600" : "bg-primary/20 text-primary"
                }`}
            >
                {isUser ? "Tôi" : "AI"}
            </div>
            <div className="flex flex-col gap-0.5 max-w-[85%]">
                <div
                    className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                        isUser
                            ? "bg-primary/10 text-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                    }`}
                >
                    {isUser ? (
                        message.content
                    ) : (
                        <div className="prose prose-xs dark:prose-invert prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 prose-headings:my-1 max-w-none text-[11px]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {!isUser && message.dataSources && message.dataSources.length > 0 && (
                    <div className="mt-0.5">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Database className="w-2.5 h-2.5" />
                            <span>Nguồn ({message.dataSources.length})</span>
                            <ChevronDown
                                className={`w-2.5 h-2.5 transition-transform ${showSources ? "rotate-180" : ""}`}
                            />
                        </button>
                        {showSources && (
                            <div className="mt-0.5 flex flex-wrap gap-0.5">
                                {message.dataSources.map((source, i) => (
                                    <span
                                        key={i}
                                        className="text-[8px] px-1 py-0.5 rounded bg-secondary/50 text-muted-foreground"
                                    >
                                        {source}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <span className="text-[8px] text-muted-foreground/60 px-1">
                    {formatMessageTime(message.timestamp)}
                </span>
            </div>
        </div>
    );
}

function BotIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    );
}
