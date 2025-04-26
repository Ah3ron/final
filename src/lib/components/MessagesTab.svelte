<script>
  import { onMount } from 'svelte';
  import { messages, onlineUsers, sendDirectMessage } from '$lib/websocket-client';
  
  let selectedUser = $state(null);
  let messageInput = $state('');
  let userMessages = $state([]);
  
  // Derived value for current conversation messages
  $effect(() => {
    if (selectedUser) {
      userMessages = $messages.filter(
        msg => (msg.senderId === selectedUser.userId && msg.recipientId === 'currentUser') || 
               (msg.senderId === 'currentUser' && msg.recipientId === selectedUser.userId)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      userMessages = [];
    }
  });
  
  // Function to send a message
  function handleSendMessage() {
    if (!messageInput.trim() || !selectedUser) return;
    
    sendDirectMessage(selectedUser.userId, messageInput);
    
    // Add message to local messages for immediate display
    messages.update(msgs => [
      {
        messageId: `local-${Date.now()}`,
        senderId: 'currentUser',
        recipientId: selectedUser.userId,
        content: messageInput,
        timestamp: new Date().toISOString(),
        isRead: true
      },
      ...msgs
    ]);
    
    messageInput = '';
  }
  
  // Function to select a user to chat with
  function selectUser(user) {
    selectedUser = user;
  }
  
  // Add some demo messages if there are none
  onMount(() => {
    if ($messages.length === 0) {
      messages.set([
        {
          messageId: 'demo-1',
          senderId: 'user1',
          recipientId: 'currentUser',
          content: 'Hello, do you have a moment to discuss the loan approval process?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false
        },
        {
          messageId: 'demo-2',
          senderId: 'user2',
          recipientId: 'currentUser',
          content: 'I need your approval on a transfer operation.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true
        }
      ]);
    }
    
    // Add demo users if there are none
    if ($onlineUsers.length === 0) {
      onlineUsers.set([
        { userId: 'user1', username: 'John Doe' },
        { userId: 'user2', username: 'Jane Smith' }
      ]);
    }
  });
</script>

<div class="messages-container">
  <div class="users-sidebar">
    <h3>Online Users</h3>
    <div class="search-box">
      <input type="text" placeholder="Search users..." />
    </div>
    <ul class="users-list">
      {#each $onlineUsers as user}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li 
          class="user-item {selectedUser && selectedUser.userId === user.userId ? 'selected' : ''}"
          onclick={() => selectUser(user)}
        >
          <span class="user-status online"></span>
          <span class="user-name">{user.username || user.userId}</span>
          {#if $messages.some(m => m.senderId === user.userId && !m.isRead)}
            <span class="unread-badge"></span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
  
  <div class="chat-area">
    {#if selectedUser}
      <div class="chat-header">
        <h3>{selectedUser.username || selectedUser.userId}</h3>
        <span class="user-status online"></span>
      </div>
      
      <div class="messages-list">
        {#if userMessages.length === 0}
          <div class="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        {:else}
          {#each userMessages as message}
            <div class="message-item {message.senderId === 'currentUser' ? 'sent' : 'received'}">
              <div class="message-content">{message.content}</div>
              <div class="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="message-input">
        <input 
          type="text" 
          placeholder="Type a message..." 
          bind:value={messageInput}
          onkeydown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onclick={handleSendMessage}>Send</button>
      </div>
    {:else}
      <div class="no-chat-selected">
        <p>Select a user to start chatting</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .messages-container {
    display: flex;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .users-sidebar {
    width: 250px;
    background-color: #f5f5f5;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
  }
  
  .users-sidebar h3 {
    padding: 15px;
    margin: 0;
    border-bottom: 1px solid #ddd;
  }
  
  .search-box {
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }
  
  .search-box input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .users-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }
  
  .user-item {
    padding: 10px 15px;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    border-bottom: 1px solid #eee;
  }
  
  .user-item:hover {
    background-color: #e9e9e9;
  }
  
  .user-item.selected {
    background-color: #e3f2fd;
  }
  
  .user-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
  }
  
  .user-status.online {
    background-color: #4CAF50;
  }
  
  .user-name {
    flex: 1;
  }
  
  .unread-badge {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #FF5722;
  }
  
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: white;
  }
  
  .chat-header {
    padding: 15px;
    border-bottom: 1px solid #ddd;
    display: flex;
    align-items: center;
  }
  
  .chat-header h3 {
    margin: 0;
    flex: 1;
  }
  
  .messages-list {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .no-messages, .no-chat-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #777;
  }
  
  .message-item {
    max-width: 70%;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 4px;
    position: relative;
  }
  
  .message-item.sent {
    align-self: flex-end;
    background-color: #e3f2fd;
  }
  
  .message-item.received {
    align-self: flex-start;
    background-color: #f5f5f5;
  }
  
  .message-time {
    font-size: 10px;
    color: #777;
    text-align: right;
    margin-top: 5px;
  }
  
  .message-input {
    padding: 15px;
    border-top: 1px solid #ddd;
    display: flex;
  }
  
  .message-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  .message-input button {
    padding: 10px 15px;
    background-color: #1976D2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .message-input button:hover {
    background-color: #1565C0;
  }
</style>
