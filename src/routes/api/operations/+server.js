import { json } from '@sveltejs/kit';
import * as bankingOperationsService from '$lib/server/services/banking-operations';

export async function GET({ url, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userId = locals.user.id;
  const department = url.searchParams.get('department');
  const status = url.searchParams.get('status');

  try {
    let operations;

    if (department) {
      // Check if user has permission to view department operations
      if (!hasPermission(locals.user, 'view_department_operations')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get operations by department
      operations = await bankingOperationsService.getOperationsByDepartment(department);
    } else if (status === 'pending' && hasPermission(locals.user, 'approve_operations')) {
      // Get pending operations that require approval
      operations = await bankingOperationsService.getPendingOperations();
    } else {
      // Get operations by requester ID (user's own operations)
      operations = await bankingOperationsService.getOperationsByRequesterId(userId);
    }

    return json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch operations' }), {
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
    const { type, data } = await request.json();

    if (!type) {
      return new Response(JSON.stringify({ error: 'Operation type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to create this type of operation
    if (!hasPermission(locals.user, `create_${type}`)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create operation
    const operation = await bankingOperationsService.createOperation(type, locals.user.id, data);

    return json(operation);
  } catch (error) {
    console.error('Error creating operation:', error);
    return new Response(JSON.stringify({ error: 'Failed to create operation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to check if user has permission
function hasPermission(user, permission) {
  // This is a simplified implementation
  // In a real system, we would check user's role and permissions

  // For now, we'll assume certain permissions based on role ID
  const rolePermissions = {
    1: [
      'view_department_operations',
      'approve_operations',
      'create_loan_approval',
      'create_transfer',
      'create_withdrawal',
      'create_deposit',
      'create_account_opening',
      'create_card_issuance'
    ], // Admin
    2: ['view_department_operations', 'approve_operations', 'create_loan_approval'], // Loan Officer
    3: ['create_transfer', 'create_withdrawal', 'create_deposit'], // Cashier
    4: ['create_account_opening', 'create_card_issuance'] // Account Manager
  };

  return rolePermissions[user.roleId]?.includes(permission) || false;
}
