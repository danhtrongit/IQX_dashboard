import api from './api';

// ==================== Chat API Types ====================

/**
 * POST /chat request body
 */
export interface ChatRequest {
    message: string;
    conversation_id?: string | null;
}

/**
 * POST /chat response
 */
export interface ChatResponse {
    message: string; // Assistant response in markdown format
    conversation_id: string;
    data_used?: string[] | null; // List of data sources used
}

/**
 * Chat message for UI
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    dataSources?: string[];
    isStreaming?: boolean;
}

/**
 * Mr.Arix info response
 */
export interface ChatInfoResponse {
    name: string;
    description: string;
    capabilities: string[];
    examples: string[];
}

// ==================== Chat API endpoints ====================

export const ChatAPI = {
    /**
     * Send a chat message to Mr.Arix
     * POST /chat
     */
    sendMessage: async (message: string, conversationId?: string | null): Promise<ChatResponse> => {
        const response = await api.post<ChatResponse>('/chat', {
            message,
            conversation_id: conversationId,
        } as ChatRequest);
        return response.data;
    },

    /**
     * Get Mr.Arix info
     * GET /chat/info
     */
    getInfo: async (): Promise<ChatInfoResponse> => {
        const response = await api.get<ChatInfoResponse>('/chat/info');
        return response.data;
    },
};

// ==================== Chat utilities ====================

/**
 * Generate a unique message ID
 */
export const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format timestamp for display
 */
export const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Create a user message
 */
export const createUserMessage = (content: string): ChatMessage => ({
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: new Date(),
});

/**
 * Create an assistant message from API response
 */
export const createAssistantMessage = (response: ChatResponse): ChatMessage => ({
    id: generateMessageId(),
    role: 'assistant',
    content: response.message,
    timestamp: new Date(),
    dataSources: response.data_used || undefined,
});

/**
 * Create a loading/streaming message
 */
export const createLoadingMessage = (): ChatMessage => ({
    id: generateMessageId(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
});

export default ChatAPI;
