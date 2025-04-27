import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getIO } from '$lib/server/websocket';

/**
 * Create a new banking operation
 * @param {string} type - Type of operation (e.g., 'loan_approval', 'transfer', 'withdrawal')
 * @param {string} requesterId - ID of the user requesting the operation
 * @param {Object} data - Operation data
 * @returns {Promise<Object>} Created operation
 */
export async function createOperation(type, requesterId, data) {
  const operation = {
    type,
    requesterId,
    status: 'pending',
    data
  };

  const [result] = await db.insert(table.bankingOperation).values(operation).returning();

  // Notify relevant departments about the new operation
  notifyDepartmentAboutOperation(type, result);

  return result;
}

/**
 * Get operation by ID
 * @param {number} id - Operation ID
 * @returns {Promise<Object|null>} Operation or null if not found
 */
export async function getOperationById(id) {
  const [operation] = await db
    .select()
    .from(table.bankingOperation)
    .where(eq(table.bankingOperation.id, id));

  return operation || null;
}

/**
 * Get operations by requester ID
 * @param {string} requesterId - Requester user ID
 * @returns {Promise<Array>} List of operations
 */
export async function getOperationsByRequesterId(requesterId) {
  return db
    .select()
    .from(table.bankingOperation)
    .where(eq(table.bankingOperation.requesterId, requesterId))
    .orderBy(table.bankingOperation.createdAt);
}

/**
 * Get operations by department
 * @param {string} department - Department name
 * @returns {Promise<Array>} List of operations
 */
export async function getOperationsByDepartment(department) {
  // This is a simplified implementation
  // In a real system, we would join with user and department tables
  // to filter operations by department

  // For now, we'll filter by operation type as a proxy for department
  const departmentOperationTypes = getDepartmentOperationTypes(department);

  return db
    .select()
    .from(table.bankingOperation)
    .where(
      departmentOperationTypes.length > 0
        ? table.bankingOperation.type.in(departmentOperationTypes)
        : undefined
    )
    .orderBy(table.bankingOperation.createdAt);
}

/**
 * Update operation status
 * @param {number} id - Operation ID
 * @param {string} status - New status ('approved', 'rejected', 'processing', 'completed')
 * @param {string} approverId - ID of the user approving/rejecting the operation
 * @returns {Promise<Object|null>} Updated operation or null if not found
 */
export async function updateOperationStatus(id, status, approverId) {
  const updateData = {
    status,
    approverId,
    updatedAt: new Date()
  };

  // If operation is completed, set completedAt
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  const [operation] = await db
    .update(table.bankingOperation)
    .set(updateData)
    .where(eq(table.bankingOperation.id, id))
    .returning();

  if (operation) {
    // Notify requester about status change
    notifyUserAboutOperationUpdate(operation);
  }

  return operation || null;
}

/**
 * Get pending operations that require approval
 * @returns {Promise<Array>} List of pending operations
 */
export async function getPendingOperations() {
  return db
    .select()
    .from(table.bankingOperation)
    .where(eq(table.bankingOperation.status, 'pending'))
    .orderBy(table.bankingOperation.createdAt);
}

/**
 * Notify department about new operation
 * @param {string} type - Operation type
 * @param {Object} operation - Operation data
 */
function notifyDepartmentAboutOperation(type, operation) {
  try {
    const io = getIO();
    const department = getOperationDepartment(type);

    if (department) {
      io.to(`department:${department}`).emit('new_operation', {
        type,
        operationId: operation.id,
        requesterId: operation.requesterId,
        timestamp: operation.createdAt
      });
    }
  } catch (error) {
    console.error('Failed to notify department about operation:', error);
  }
}

/**
 * Notify user about operation update
 * @param {Object} operation - Updated operation
 */
function notifyUserAboutOperationUpdate(operation) {
  try {
    const io = getIO();
    const userSockets = getUserSockets(operation.requesterId);

    if (userSockets && userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit('operation_update', {
          operationId: operation.id,
          status: operation.status,
          updatedAt: operation.updatedAt
        });
      });
    }

    // Also create a notification in the database
    createNotification(
      operation.requesterId,
      'Operation Update',
      `Your ${operation.type} operation has been ${operation.status}`,
      'operation_update',
      'banking_operation',
      operation.id.toString()
    );
  } catch (error) {
    console.error('Failed to notify user about operation update:', error);
  }
}

/**
 * Create a notification
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} content - Notification content
 * @param {string} type - Notification type
 * @param {string} relatedEntityType - Related entity type
 * @param {string} relatedEntityId - Related entity ID
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(
  userId,
  title,
  content,
  type,
  relatedEntityType,
  relatedEntityId
) {
  const notification = {
    userId,
    title,
    content,
    type,
    relatedEntityType,
    relatedEntityId
  };

  const [result] = await db.insert(table.notification).values(notification).returning();

  return result;
}

/**
 * Get department for operation type
 * @param {string} type - Operation type
 * @returns {string|null} Department name or null
 */
function getOperationDepartment(type) {
  const operationDepartments = {
    loan_approval: 'loans',
    transfer: 'transfers',
    withdrawal: 'cashiers',
    deposit: 'cashiers',
    account_opening: 'accounts',
    card_issuance: 'cards'
  };

  return operationDepartments[type] || null;
}

/**
 * Get operation types handled by department
 * @param {string} department - Department name
 * @returns {Array<string>} List of operation types
 */
function getDepartmentOperationTypes(department) {
  const departmentOperations = {
    loans: ['loan_approval', 'loan_disbursement'],
    transfers: ['transfer', 'wire_transfer'],
    cashiers: ['withdrawal', 'deposit'],
    accounts: ['account_opening', 'account_closing'],
    cards: ['card_issuance', 'card_blocking']
  };

  return departmentOperations[department] || [];
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
