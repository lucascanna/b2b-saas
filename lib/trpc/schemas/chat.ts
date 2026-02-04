/**
 * Chat schemas for tRPC validation
 *
 * These schemas validate chat-related API requests
 * CLIENT-SAFE - No server dependencies
 */

import { z } from 'zod';

// ============================================================================
// Chat Session Schemas
// ============================================================================

export const createChatSessionSchema = z.object({
  organizationId: z.string().uuid(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .default('New Chat'),
});

export const listChatSessionsSchema = z.object({
  organizationId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(20),
});

export const getSessionSchema = z.object({
  chatSessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const deleteChatSessionSchema = z.object({
  chatSessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const updateChatSessionTitleSchema = z.object({
  chatSessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
});

// ============================================================================
// Chat Message Schemas
// ============================================================================

export const getMessagesSchema = z.object({
  chatSessionId: z.string().uuid(),
  organizationId: z.string().uuid(),
});
