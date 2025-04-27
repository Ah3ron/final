import { json } from '@sveltejs/kit';
import * as messagingService from '$lib/server/services/messaging';

export async function GET({ url, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userId = locals.user.id;
  const recipientId = url.searchParams.get('recipientId');
  const departmentId = url.searchParams.get('departmentId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    let messages;

    if (recipientId) {
      // Get direct messages between users
      messages = await messagingService.getDirectMessagesBetweenUsers(
        userId,
        recipientId,
        limit,
        offset
      );
    } else if (departmentId) {
      // Get department messages
      messages = await messagingService.getDepartmentMessages(
        parseInt(departmentId, 10),
        limit,
        offset
      );
    } else {
      // Get user's recent conversations
      const conversations = await messagingService.getUserRecentConversations(userId);
      return json(conversations);
    }

    return json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { recipientId, departmentId, content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let message;

    if (recipientId) {
      // Send direct message
      message = await messagingService.sendDirectMessage(locals.user.id, recipientId, content);
    } else if (departmentId) {
      // Send department message
      message = await messagingService.sendDepartmentMessage(
        locals.user.id,
        parseInt(departmentId, 10),
        content
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Either recipientId or departmentId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
