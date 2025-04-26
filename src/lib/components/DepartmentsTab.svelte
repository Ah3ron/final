<script>
  import { onMount } from 'svelte';
  import { departmentMessages, joinDepartment, leaveDepartment, sendDepartmentMessage } from '$lib/websocket-client';
  
  // Demo departments
  const departments = [
    { id: 1, name: 'Loans', description: 'Loan processing and approvals' },
    { id: 2, name: 'Transfers', description: 'Money transfer operations' },
    { id: 3, name: 'Cashiers', description: 'Cash operations and management' },
    { id: 4, name: 'Accounts', description: 'Account management and services' },
    { id: 5, name: 'Cards', description: 'Credit and debit card services' }
  ];
  
  let selectedDepartment = null;
  let messageInput = '';
  let departmentMembers = [];
  
  // Function to select a department
  function selectDepartment(department) {
    if (selectedDepartment) {
      leaveDepartment(selectedDepartment.id);
    }
    
    selectedDepartment = department;
    joinDepartment(department.id);
    
    // Demo department members
    departmentMembers = [
      { userId: 'user1', username: 'John Doe', position: 'Department Manager' },
      { userId: 'user2', username: 'Jane Smith', position: 'Senior Specialist' },
      { userId: 'user3', username: 'Robert Johnson', position: 'Specialist' }
    ];
  }
  
  // Function to send a message to the department
  function handleSendMessage() {
    if (!messageInput.trim() || !selectedDepartment) return;
    
    sendDepartmentMessage(selectedDepartment.id, messageInput);
    
    // Add message to local department messages for immediate display
    departmentMessages.update(deptMsgs => {
      const dept = selectedDepartment.id;
      const deptMessages = deptMsgs[dept] || [];
      
      return {
        ...deptMsgs,
        [dept]: [
          {
            messageId: `local-${Date.now()}`,
            senderId: 'currentUser',
            departmentId: dept,
            content: messageInput,
            timestamp: new Date().toISOString()
          },
          ...deptMessages
        ]
      };
    });
    
    messageInput = '';
  }
  
  // Initialize with some demo department messages
  onMount(() => {
    // Add demo messages for departments
    departmentMessages.update(deptMsgs => {
      return {
        1: [
          {
            messageId: 'dept1-msg1',
            senderId: 'user1',
            departmentId: 1,
            content: 'Team, we need to review the new loan approval process.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            messageId: 'dept1-msg2',
            senderId: 'user2',
            departmentId: 1,
            content: 'I\'ve prepared the documentation for the updated process.',
            timestamp: new Date(Date.now() - 3500000).toISOString()
          }
        ],
        2: [
          {
            messageId: 'dept2-msg1',
            senderId: 'user3',
            departmentId: 2,
            content: 'The international transfer system will be down for maintenance tonight.',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        ...deptMsgs
      };
    });
  });
</script>

<div class="departments-container">
  <div class="departments-sidebar">
    <h3>Departments</h3>
    <ul class="departments-list">
      {#each departments as department}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li 
          class="department-item {selectedDepartment && selectedDepartment.id === department.id ? 'selected' : ''}"
          onclick={() => selectDepartment(department)}
        >
          <div class="department-name">{department.name}</div>
          <div class="department-description">{department.description}</div>
        </li>
      {/each}
    </ul>
  </div>
  
  <div class="department-content">
    {#if selectedDepartment}
      <div class="department-header">
        <h2>{selectedDepartment.name}</h2>
        <p>{selectedDepartment.description}</p>
      </div>
      
      <div class="department-body">
        <div class="department-chat">
          <div class="chat-messages">
            {#if !$departmentMessages[selectedDepartment.id] || $departmentMessages[selectedDepartment.id].length === 0}
              <div class="no-messages">
                <p>No messages in this department channel yet.</p>
              </div>
            {:else}
              {#each $departmentMessages[selectedDepartment.id] as message}
                <div class="message-item {message.senderId === 'currentUser' ? 'sent' : 'received'}">
                  <div class="message-sender">{message.senderId === 'currentUser' ? 'You' : message.senderId}</div>
                  <div class="message-content">{message.content}</div>
                  <div class="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
              {/each}
            {/if}
          </div>
          
          <div class="message-input">
            <input 
              type="text" 
              placeholder="Type a message to the department..." 
              bind:value={messageInput}
              onkeydown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onclick={handleSendMessage}>Send</button>
          </div>
        </div>
        
        <div class="department-members">
          <h3>Members ({departmentMembers.length})</h3>
          <ul class="members-list">
            {#each departmentMembers as member}
              <li class="member-item">
                <div class="member-name">{member.username}</div>
                <div class="member-position">{member.position}</div>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {:else}
      <div class="no-department-selected">
        <p>Select a department to view details and chat</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .departments-container {
    display: flex;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .departments-sidebar {
    width: 250px;
    background-color: #f5f5f5;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
  }
  
  .departments-sidebar h3 {
    padding: 15px;
    margin: 0;
    border-bottom: 1px solid #ddd;
  }
  
  .departments-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
  }
  
  .department-item {
    padding: 15px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }
  
  .department-item:hover {
    background-color: #e9e9e9;
  }
  
  .department-item.selected {
    background-color: #e3f2fd;
  }
  
  .department-name {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .department-description {
    font-size: 12px;
    color: #777;
  }
  
  .department-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: white;
  }
  
  .department-header {
    padding: 15px;
    border-bottom: 1px solid #ddd;
  }
  
  .department-header h2 {
    margin: 0 0 10px 0;
  }
  
  .department-header p {
    margin: 0;
    color: #777;
  }
  
  .department-body {
    flex: 1;
    display: flex;
  }
  
  .department-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ddd;
  }
  
  .chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .no-messages, .no-department-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #777;
  }
  
  .message-item {
    max-width: 70%;
    margin-bottom: 15px;
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
  
  .message-sender {
    font-weight: bold;
    margin-bottom: 5px;
    font-size: 12px;
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
  
  .department-members {
    width: 250px;
    padding: 15px;
    border-left: 1px solid #ddd;
    overflow-y: auto;
  }
  
  .department-members h3 {
    margin-top: 0;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .members-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .member-item {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  
  .member-name {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .member-position {
    font-size: 12px;
    color: #777;
  }
</style>
