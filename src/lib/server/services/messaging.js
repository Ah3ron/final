import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { getIO } from '$lib/server/websocket';

/**
 * Send a direct message to another user
 * @param {string} senderId - Sender user ID
 * @param {string} recipientId - Recipient user ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
export async function sendDirectMessage(senderId, recipientId, content) {
  const message = {
    senderId,
    recipientId,
    content,
    isRead: false
  };

  const [result] = await db.insert(table.message).values(message).returning();

  // Notify recipient about new message
  notifyUserAboutNewMessage(recipientId, result);

  return result;
}

/**
 * Send a message to a department
 * @param {string} senderId - Sender user ID
 * @param {number} departmentId - Department ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
export async function sendDepartmentMessage(senderId, departmentId, content) {
  const message = {
    senderId,
    departmentId,
    content,
    isRead: false
  };

  const [result] = await db.insert(table.message).values(message).returning();

  // Notify department about new message
  notifyDepartmentAboutNewMessage(departmentId, result);

  return result;
}

/**
 * Get direct messages between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {number} limit - Maximum number of messages to return
 * @param {number} offset - Number of messages to skip
 * @returns {Promise<Array>} List of messages
 */
export async function getDirectMessagesBetweenUsers(userId1, userId2, limit = 50, offset = 0) {
  return db
    .select()
    .from(table.message)
    .where(
      and(
        isNull(table.message.departmentId),
        or(
          and(eq(table.message.senderId, userId1), eq(table.message.recipientId, userId2)),
          and(eq(table.message.senderId, userId2), eq(table.message.recipientId, userId1))
        )
      )
    )
    .orderBy(desc(table.message.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get department messages
 * @param {number} departmentId - Department ID
 * @param {number} limit - Maximum number of messages to return
 * @param {number} offset - Number of messages to skip
 * @returns {Promise<Array>} List of messages
 */
export async function getDepartmentMessages(departmentId, limit = 50, offset = 0) {
  return db
    .select()
    .from(table.message)
    .where(eq(table.message.departmentId, departmentId))
    .orderBy(desc(table.message.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Mark message as read
 * @param {number} messageId - Message ID
 * @returns {Promise<Object|null>} Updated message or null if not found
 */
export async function markMessageAsRead(messageId) {
  const [message] = await db
    .update(table.message)
    .set({ isRead: true })
    .where(eq(table.message.id, messageId))
    .returning();

  return message || null;
}

/**
 * Get unread messages for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of unread messages
 */
export async function getUnreadMessagesForUser(userId) {
  return db
    .select()
    .from(table.message)
    .where(and(eq(table.message.recipientId, userId), eq(table.message.isRead, false)))
    .orderBy(desc(table.message.createdAt));
}

/**
 * Get user's recent conversations
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of recent conversations
 */
export async function getUserRecentConversations(userId) {
  // This is a simplified implementation
  // In a real system, we would use a more efficient query
  // to get the most recent message from each conversation

  // Get all messages where user is sender or recipient
  const messages = await db
    .select()
    .from(table.message)
    .where(
      and(
        isNull(table.message.departmentId),
        or(eq(table.message.senderId, userId), eq(table.message.recipientId, userId))
      )
    )
    .orderBy(desc(table.message.createdAt));

  // Group messages by conversation
  const conversations = new Map();

  for (const message of messages) {
    const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;

    if (!conversations.has(otherUserId)) {
      conversations.set(otherUserId, {
        userId: otherUserId,
        lastMessage: message,
        unreadCount: message.recipientId === userId && !message.isRead ? 1 : 0
      });
    } else if (message.recipientId === userId && !message.isRead) {
      conversations.get(otherUserId).unreadCount++;
    }
  }

  return Array.from(conversations.values());
}

/**
 * Notify user about new message
 * @param {string} userId - User ID
 * @param {Object} message - Message data
 */
function notifyUserAboutNewMessage(userId, message) {
  try {
    const io = getIO();
    const userSockets = getUserSockets(userId);

    if (userSockets && userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit('new_message', {
          messageId: message.id,
          senderId: message.senderId,
          content: message.content,
          timestamp: message.createdAt
        });
      });
    }
  } catch (error) {
    console.error('Failed to notify user about new message:', error);
  }
}

/**
 * Notify department about new message
 * @param {number} departmentId - Department ID
 * @param {Object} message - Message data
 */
function notifyDepartmentAboutNewMessage(departmentId, message) {
  try {
    const io = getIO();

    io.to(`department:${departmentId}`).emit('new_department_message', {
      messageId: message.id,
      senderId: message.senderId,
      departmentId: message.departmentId,
      content: message.content,
      timestamp: message.createdAt
    });
  } catch (error) {
    console.error('Failed to notify department about new message:', error);
  }
}

/**
 * Get user's socket connections
 * @param {string} userId - User ID
 * @returns {Set<string>|null} Set of socket IDs or null
 */
function getUserSockets(userId) {
  try {
    const io = getIO();
    // This is a simplified implementation
    // In a real system, we would have a proper way to get user sockets
    return io.sockets.adapter.rooms.get(userId);
  } catch (error) {
    console.error('Failed to get user sockets:', error);
    return null;
  }
}
