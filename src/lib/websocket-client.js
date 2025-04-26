import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import io from 'socket.io-client';

// Stores for WebSocket state
export const connected = writable(false);
export const connecting = writable(false);
export const connectionError = writable(null);
export const onlineUsers = writable([]);
export const messages = writable([]);
export const departmentMessages = writable({});
export const notifications = writable([]);
export const operations = writable([]);

// Initialize with some demo data for operations
operations.set([
  {
    id: 1,
    type: 'loan_approval',
    requesterId: 'user1',
    status: 'pending',
    data: { amount: 50000, term: 60, purpose: 'Home renovation' },
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    type: 'transfer',
    requesterId: 'user2',
    status: 'approved',
    data: { amount: 5000, toAccount: '1234567890', fromAccount: '0987654321' },
    createdAt: new Date().toISOString()
  }
]);

// Derived store for unread message count
export const unreadMessageCount = derived(messages, ($messages) => {
  return $messages.filter(msg => !msg.isRead).length;
});

// Socket instance
let socket;

// Initialize WebSocket connection
export function initWebSocket(token) {
  if (!browser) return;
  
  if (socket) {
    // Already connected or connecting
    return;
  }
  
  connecting.set(true);
  connectionError.set(null);
  
  // Connect to WebSocket server
  socket = io({
    auth: {
      token
    }
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('WebSocket connected');
    connected.set(true);
    connecting.set(false);
    connectionError.set(null);
    
    // Authenticate with token
    socket.emit('authenticate', token);
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
    connected.set(false);
  });
  
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    connecting.set(false);
    connectionError.set(error.message);
  });
  
  // Authentication events
  socket.on('authenticated', (userData) => {
    console.log('WebSocket authenticated:', userData);
  });
  
  socket.on('auth_error', (error) => {
    console.error('WebSocket authentication error:', error);
    connectionError.set(error);
    
    // Redirect to login page if authentication fails
    goto('/login');
  });
  
  // User events
  socket.on('online_users', (users) => {
    console.log('Online users:', users);
    onlineUsers.set(users);
  });
  
  socket.on('user_online', (user) => {
    console.log('User online:', user);
    onlineUsers.update(users => {
      if (!users.find(u => u.userId === user.userId)) {
        return [...users, user];
      }
      return users;
    });
  });
  
  socket.on('user_offline', (user) => {
    console.log('User offline:', user);
    onlineUsers.update(users => users.filter(u => u.userId !== user.userId));
  });
  
  // Message events
  socket.on('new_message', (message) => {
    console.log('New message:', message);
    messages.update(msgs => [message, ...msgs]);
    
    // Add notification for new message
    notifications.update(notifs => [
      {
        id: `msg-${message.messageId}`,
        type: 'message',
        title: 'New Message',
        content: `New message from ${message.senderId}`,
        timestamp: message.timestamp,
        read: false
      },
      ...notifs
    ]);
  });
  
  socket.on('message_sent', (confirmation) => {
    console.log('Message sent confirmation:', confirmation);
  });
  
  // Department events
  socket.on('joined_department', (department) => {
    console.log('Joined department:', department);
  });
  
  socket.on('user_joined_department', (data) => {
    console.log('User joined department:', data);
  });
  
  socket.on('user_left_department', (data) => {
    console.log('User left department:', data);
  });
  
  socket.on('new_department_message', (message) => {
    console.log('New department message:', message);
    
    departmentMessages.update(deptMsgs => {
      const dept = message.departmentId;
      const deptMessages = deptMsgs[dept] || [];
      
      return {
        ...deptMsgs,
        [dept]: [message, ...deptMessages]
      };
    });
    
    // Add notification for new department message
    notifications.update(notifs => [
      {
        id: `dept-msg-${message.messageId}`,
        type: 'department_message',
        title: 'New Department Message',
        content: `New message in department ${message.departmentId}`,
        timestamp: message.timestamp,
        read: false
      },
      ...notifs
    ]);
  });
  
  // Operation events
  socket.on('new_operation', (operation) => {
    console.log('New operation:', operation);
    operations.update(ops => [operation, ...ops]);
    
    // Add notification for new operation
    notifications.update(notifs => [
      {
        id: `op-${operation.operationId}`,
        type: 'operation',
        title: 'New Operation',
        content: `New ${operation.type} operation from ${operation.requesterId}`,
        timestamp: operation.timestamp,
        read: false
      },
      ...notifs
    ]);
  });
  
  socket.on('operation_update', (update) => {
    console.log('Operation update:', update);
    operations.update(ops => 
      ops.map(op => 
        op.id === update.operationId 
          ? { ...op, status: update.status, updatedAt: update.updatedAt } 
          : op
      )
    );
    
    // Add notification for operation update
    notifications.update(notifs => [
      {
        id: `op-update-${update.operationId}`,
        type: 'operation_update',
        title: 'Operation Update',
        content: `Operation ${update.operationId} status changed to ${update.status}`,
        timestamp: update.updatedAt,
        read: false
      },
      ...notifs
    ]);
  });
  
  // Error events
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  return socket;
}

// Send a direct message
export function sendDirectMessage(recipientId, content) {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return false;
  }
  
  socket.emit('direct_message', { recipientId, message: content });
  return true;
}

// Send a department message
export function sendDepartmentMessage(department, content) {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return false;
  }
  
  socket.emit('department_message', { department, message: content });
  return true;
}

// Join a department channel
export function joinDepartment(department) {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return false;
  }
  
  socket.emit('join_department', department);
  return true;
}

// Leave a department channel
export function leaveDepartment(department) {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return false;
  }
  
  socket.emit('leave_department', department);
  return true;
}

// Request a banking operation
export function requestOperation(type, data) {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return false;
  }
  
  socket.emit('operation_request', { type, data });
  return true;
}

// Mark a notification as read
export function markNotificationAsRead(notificationId) {
  notifications.update(notifs => 
    notifs.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true } 
        : notif
    )
  );
}

// Disconnect WebSocket
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connected.set(false);
  }
}
