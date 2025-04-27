import * as auth from '$lib/server/auth.js';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';

// WebSocket initialization will be handled separately
// This is a simplified version to make the application work

// Update user's last active timestamp
async function updateUserActivity(userId) {
  if (!userId) return;

  try {
    await db.update(table.user).set({ lastActive: new Date() }).where(eq(table.user.id, userId));
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
}

// Handle authentication
const handleAuth = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

    // Update user's last active timestamp
    if (user) {
      updateUserActivity(user.id);
    }
  } else {
    auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
};

export const handle = handleAuth;
