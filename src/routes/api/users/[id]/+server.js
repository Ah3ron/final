import { json } from '@sveltejs/kit';
import * as userService from '$lib/server/services/users';

export async function GET({ params, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  try {
    const user = await userService.getUserById(id);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return json(user);
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PATCH({ params, request, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  // Only allow users to update their own profile or admins to update any profile
  if (id !== locals.user.id && !isAdmin(locals.user)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userData = await request.json();

    // Don't allow changing username through this endpoint
    delete userData.username;

    // Don't allow changing password through this endpoint
    delete userData.passwordHash;

    // Only admins can change role and department
    if (!isAdmin(locals.user)) {
      delete userData.roleId;
      delete userData.departmentId;
    }

    const updatedUser = await userService.updateUserProfile(id, userData);

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ params, locals }) {
  // Check if user is authenticated and has admin role
  if (!locals.user || !isAdmin(locals.user)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  // Prevent deleting own account
  if (id === locals.user.id) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // In a real application, we might want to soft delete users instead
    // For now, we'll just deactivate the user
    const updatedUser = await userService.updateUserProfile(id, { isActive: false });

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to check if user is admin
function isAdmin(user) {
  // This is a simplified implementation
  // In a real system, we would check user's role and permissions
  return user.roleId === 1; // Assuming role ID 1 is admin
}
