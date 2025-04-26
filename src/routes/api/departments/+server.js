import { json } from '@sveltejs/kit';
import * as userService from '$lib/server/services/users';

export async function GET({ locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const departments = await userService.getAllDepartments();
    return json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch departments' }), {
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
    const { name, description } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Department name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create department
    const department = await userService.createDepartment(name, description);

    return json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return new Response(JSON.stringify({ error: 'Failed to create department' }), {
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
