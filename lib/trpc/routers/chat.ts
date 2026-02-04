/**
 * Chat tRPC Router
 *
 * Thin layer for chat operations - validates input and calls chat service
 * Service layer handles all business logic and database operations
 */

import { TRPCError } from '@trpc/server';
import { UIDataTypes, UIMessagePart, UITools } from 'ai';

import * as chatService from '@/lib/services/chat-service';
import { orgProcedure, router } from '@/lib/trpc/init';
import {
  createChatSessionSchema,
  deleteChatSessionSchema,
  getMessagesSchema,
  getSessionSchema,
  listChatSessionsSchema,
  updateChatSessionTitleSchema,
} from '@/lib/trpc/schemas/chat';
import { messageMetadataSchema } from '@/lib/types/chat';

export const chatRouter = router({
  /**
   * List all chat sessions for an organization
   * Uses efficient SQL COUNT() for pagination
   */
  listSessions: orgProcedure.input(listChatSessionsSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, organizationId } = input;

    return await chatService.listSessions({
      organizationId,
      userId: ctx.userId,
      page,
      pageSize,
    });
  }),

  /**
   * Get a single chat session by ID
   */
  getSession: orgProcedure.input(getSessionSchema).query(async ({ ctx, input }) => {
    const { organizationId, chatSessionId } = input;

    const session = await chatService.getSession(chatSessionId, organizationId, ctx.userId);

    if (!session) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Chat session not found',
      });
    }

    return session;
  }),

  /**
   * Get all messages for a chat session in UIMessage format
   * Sources contain document IDs + proxy URLs for downloads
   * Uses Zod validation for runtime type safety
   */
  getMessages: orgProcedure.input(getMessagesSchema).query(async ({ ctx, input }) => {
    const { organizationId, chatSessionId } = input;

    // Verify session exists and belongs to user
    const session = await chatService.getSession(chatSessionId, organizationId, ctx.userId);

    if (!session) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Chat session not found',
      });
    }

    // Get messages with metadata parsed
    const rawMessages = await chatService.getMessages(chatSessionId);

    // Parse and validate messages
    const messages = rawMessages.map((message) => {
      try {
        const parts = JSON.parse(message.parts) as UIMessagePart<UIDataTypes, UITools>[];

        const metadata = message.metadata;

        // Validate metadata structure (contains document sources)
        if (metadata) {
          messageMetadataSchema.parse(metadata);
        }

        return {
          id: message.id,
          role: message.role,
          parts,
          metadata,
          createdAt: message.createdAt,
        };
      } catch (error) {
        console.error('Message validation failed:', {
          messageId: message.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse message data',
          cause: error,
        });
      }
    });

    return { messages };
  }),

  /**
   * Create a new chat session
   */
  createSession: orgProcedure.input(createChatSessionSchema).mutation(async ({ ctx, input }) => {
    const { organizationId, title } = input;

    return await chatService.createSession({
      organizationId,
      userId: ctx.userId,
      title,
    });
  }),

  /**
   * Delete a chat session
   */
  deleteSession: orgProcedure.input(deleteChatSessionSchema).mutation(async ({ ctx, input }) => {
    const { organizationId, chatSessionId } = input;

    await chatService.deleteSession(chatSessionId, organizationId, ctx.userId);

    return { success: true };
  }),

  /**
   * Update chat session title
   */
  updateSession: orgProcedure
    .input(updateChatSessionTitleSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, chatSessionId, title } = input;

      await chatService.updateSessionTitle(chatSessionId, organizationId, ctx.userId, title);

      return { success: true };
    }),
});
