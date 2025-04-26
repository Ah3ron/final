import { json } from '@sveltejs/kit';
import * as userService from '$lib/server/services/users';

export async function GET({ url, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const query = url.searchParams.get('query');
  const departmentId = url.searchParams.get('departmentId');

  try {
    let users;

    if (query) {
      // Search users by query
      users = await userService.searchUsers(query);
    } else if (departmentId) {
      // Get users by department
      users = await userService.getUsersByDepartmentId(parseInt(departmentId, 10));
    } else {
      // Get all departments to group users
      const departments = await userService.getAllDepartments();
      const result = [];

      for (const department of departments) {
        const departmentUsers = await userService.getUsersByDepartmentId(department.id);
        result.push({
          department,
          users: departmentUsers
        });
      }

      return json(result);
    }

    return json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals }) {
  // Check if user is authenticated and has admin role
  if (!locals.user || !isAdmin(locals.user)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userData = await request.json();

    // Validate user data
    if (!userData.username || !userData.password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if username already exists
    const existingUser = await userService.getUserByUsername(userData.username);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user
    const user = await userService.createUser(userData);

    return json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
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
