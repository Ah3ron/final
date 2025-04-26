import { Server } from 'socket.io';
import * as auth from '$lib/server/auth';

/**
 * @type {import('socket.io').Server}
 */
let io;

/**
 * Map of user IDs to socket IDs
 * @type {Map<string, Set<string>>}
 */
const userSockets = new Map();

/**
 * Map of department channels
 * @type {Map<string, Set<string>>}
 */
const departmentChannels = new Map();

/**
 * Initialize the WebSocket server
 * @param {import('http').Server} server
 */
export function initWebSocketServer(server) {
  io = new Server(server);

  io.on('connection', (socket) => {
    let userId = null;

    // Authenticate the socket connection
    socket.on('authenticate', async (token) => {
      try {
        const { user } = await auth.validateSessionToken(token);
        if (!user) {
          socket.emit('auth_error', 'Invalid authentication token');
          return;
        }

        userId = user.id;
        
        // Add socket to user's socket set
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        socket.emit('authenticated', { userId: user.id, username: user.username });
        
        // Broadcast user online status
        socket.broadcast.emit('user_online', { userId: user.id, username: user.username });
        
        // Send current online users
        const onlineUsers = [];
        for (const [uid, sockets] of userSockets.entries()) {
          if (sockets.size > 0 && uid !== userId) {
            // We would need to fetch user details from the database here
            // For now, just sending the user ID
            onlineUsers.push({ userId: uid });
          }
        }
        socket.emit('online_users', onlineUsers);
      } catch (error) {
        socket.emit('auth_error', 'Authentication failed');
      }
    });

    // Join department channel
    socket.on('join_department', (department) => {
      if (!userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      socket.join(`department:${department}`);
      
      if (!departmentChannels.has(department)) {
        departmentChannels.set(department, new Set());
      }
      departmentChannels.get(department).add(userId);
      
      socket.emit('joined_department', department);
      socket.to(`department:${department}`).emit('user_joined_department', { userId, department });
    });

    // Leave department channel
    socket.on('leave_department', (department) => {
      if (!userId) return;
      
      socket.leave(`department:${department}`);
      
      if (departmentChannels.has(department)) {
        departmentChannels.get(department).delete(userId);
      }
      
      socket.to(`department:${department}`).emit('user_left_department', { userId, department });
    });

    // Send message to a specific user
    socket.on('direct_message', ({ recipientId, message }) => {
      if (!userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      const recipientSockets = userSockets.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        // Send to all recipient's connected devices
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('direct_message', {
            from: userId,
            message,
            timestamp: new Date().toISOString()
          });
        });
        
        // Confirm message was sent
        socket.emit('message_sent', { to: recipientId, message });
      } else {
        // User is offline, store message for later delivery
        // This would require a database implementation
        socket.emit('user_offline', { userId: recipientId });
      }
    });

    // Send message to department
    socket.on('department_message', ({ department, message }) => {
      if (!userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      socket.to(`department:${department}`).emit('department_message', {
        from: userId,
        department,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Confirm message was sent
      socket.emit('department_message_sent', { department, message });
    });

    // Handle banking operation requests
    socket.on('operation_request', ({ type, data }) => {
      if (!userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }
      
      // Here we would implement specific banking operations
      // For now, just echo back the request
      socket.emit('operation_response', { 
        type, 
        status: 'received',
        requestId: generateRequestId(),
        timestamp: new Date().toISOString()
      });
      
      // Notify relevant departments about the operation
      // This is a simplified example
      if (type === 'loan_approval') {
        socket.to('department:loans').emit('new_operation', {
          type,
          from: userId,
          data,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        
        // If this was the user's last connection, broadcast offline status
        if (userSockets.get(userId).size === 0) {
          socket.broadcast.emit('user_offline', { userId });
          
          // Remove user from all department channels
          for (const [dept, users] of departmentChannels.entries()) {
            if (users.has(userId)) {
              users.delete(userId);
              socket.to(`department:${dept}`).emit('user_left_department', { userId, department: dept });
            }
          }
        }
      }
    });
  });

  return io;
}

/**
 * Get the WebSocket server instance
 * @returns {import('socket.io').Server}
 */
export function getIO() {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

/**
 * Generate a unique request ID
 * @returns {string}
 */
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
