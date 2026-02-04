/**
 * Chat Service
 *
 * Business logic for chat sessions and messages
 * All database operations and authorization logic for chat functionality
 */

import { and, asc, count, desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  type ChatMessage,
  type ChatSession,
  type NewChatMessage,
  type NewChatSession,
  chatMessages,
  chatSessions,
} from '@/lib/db/schema';

// ============================================================================
// Chat Session Operations
// ============================================================================

export interface ListSessionsOptions {
  organizationId: string;
  userId: string;
  page: number;
  pageSize: number;
}

export interface ListSessionsResult {
  sessions: ChatSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * List all chat sessions for a user in an organization
 * Uses efficient SQL COUNT() for pagination
 */
export async function listSessions(options: ListSessionsOptions): Promise<ListSessionsResult> {
  const { organizationId, userId, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  // Get total count using SQL COUNT() function (efficient)
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(chatSessions)
    .where(and(eq(chatSessions.organizationId, organizationId), eq(chatSessions.userId, userId)));

  // Get paginated results
  const sessions = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.organizationId, organizationId), eq(chatSessions.userId, userId)))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    sessions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single chat session by ID
 * Validates user ownership
 */
export async function getSession(
  chatSessionId: string,
  organizationId: string,
  userId: string
): Promise<ChatSession | null> {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatSessionId),
        eq(chatSessions.organizationId, organizationId),
        eq(chatSessions.userId, userId)
      )
    )
    .limit(1);

  return session ?? null;
}

/**
 * Create a new chat session
 */
export async function createSession(data: NewChatSession): Promise<ChatSession> {
  const [session] = await db.insert(chatSessions).values(data).returning();

  if (!session) {
    throw new Error('Failed to create chat session');
  }

  return session;
}

/**
 * Update chat session title
 */
export async function updateSessionTitle(
  chatSessionId: string,
  organizationId: string,
  userId: string,
  title: string
): Promise<ChatSession> {
  const [updated] = await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(chatSessions.id, chatSessionId),
        eq(chatSessions.organizationId, organizationId),
        eq(chatSessions.userId, userId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error('Failed to update chat session or session not found');
  }

  return updated;
}

/**
 * Delete a chat session (messages cascade delete)
 */
export async function deleteSession(
  chatSessionId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  await db
    .delete(chatSessions)
    .where(
      and(
        eq(chatSessions.id, chatSessionId),
        eq(chatSessions.organizationId, organizationId),
        eq(chatSessions.userId, userId)
      )
    );
}

// ============================================================================
// Chat Message Operations
// ============================================================================

export interface MessageWithMetadata extends ChatMessage {
  metadata?: {
    sources?: Array<{
      documentId: string;
      title: string;
      url: string;
    }>;
  };
}

/**
 * Get all messages for a chat session
 * Returns messages ordered by creation time
 */
export async function getMessages(chatSessionId: string): Promise<MessageWithMetadata[]> {
  const rawMessages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatSessionId, chatSessionId))
    .orderBy(asc(chatMessages.createdAt));

  // Parse metadata from JSON strings
  return rawMessages.map((message) => ({
    ...message,
    metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
  }));
}

/**
 * Get existing messages count for a session
 * Used to determine which messages are new during streaming
 */
export async function getMessagesCount(chatSessionId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(chatMessages)
    .where(eq(chatMessages.chatSessionId, chatSessionId));

  return result.count;
}

/**
 * Create new chat messages
 * Used to save messages after streaming completes
 */
export async function createMessages(messages: NewChatMessage[]): Promise<ChatMessage[]> {
  if (messages.length === 0) {
    return [];
  }

  const inserted = await db.insert(chatMessages).values(messages).returning();

  return inserted;
}

/**
 * Update session timestamp
 * Called after new messages are added
 */
export async function updateSessionTimestamp(chatSessionId: string): Promise<void> {
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, chatSessionId));
}
