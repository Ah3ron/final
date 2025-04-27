import { json } from '@sveltejs/kit';
import * as bankingOperationsService from '$lib/server/services/banking-operations';

export async function GET({ params, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;
  const operationId = parseInt(id, 10);

  try {
    const operation = await bankingOperationsService.getOperationById(operationId);

    if (!operation) {
      return new Response(JSON.stringify({ error: 'Operation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to view this operation
    if (
      operation.requesterId !== locals.user.id &&
      !hasPermission(locals.user, 'view_department_operations')
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return json(operation);
  } catch (error) {
    console.error(`Error fetching operation ${id}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch operation' }), {
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
  const operationId = parseInt(id, 10);

  try {
    const { status } = await request.json();

    if (!status) {
      return new Response(JSON.stringify({ error: 'Status is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to update operation status
    if (!hasPermission(locals.user, 'approve_operations')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update operation status
    const operation = await bankingOperationsService.updateOperationStatus(
      operationId,
      status,
      locals.user.id
    );

    if (!operation) {
      return new Response(JSON.stringify({ error: 'Operation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return json(operation);
  } catch (error) {
    console.error(`Error updating operation ${id}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to update operation' }), {
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
