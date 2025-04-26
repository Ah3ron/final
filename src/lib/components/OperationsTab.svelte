<script>
  import { onMount } from 'svelte';
  import { operations, requestOperation } from '$lib/websocket-client';
  
  // Operation types
  const operationTypes = [
    { id: 'loan_approval', name: 'Loan Approval', department: 'Loans' },
    { id: 'transfer', name: 'Money Transfer', department: 'Transfers' },
    { id: 'withdrawal', name: 'Cash Withdrawal', department: 'Cashiers' },
    { id: 'deposit', name: 'Cash Deposit', department: 'Cashiers' },
    { id: 'account_opening', name: 'Account Opening', department: 'Accounts' },
    { id: 'card_issuance', name: 'Card Issuance', department: 'Cards' }
  ];
  
  let selectedOperation = $state(null);
  let selectedTab = $state('all'); // 'all', 'pending', 'approved', 'rejected'
  let newOperationType = $state(operationTypes[0].id);
  let newOperationData = $state({});
  
  // Filtered operations based on selected tab
  $effect(() => {
    if (selectedTab === 'all') {
      filteredOperations = $operations;
    } else {
      filteredOperations = $operations.filter(op => op.status === selectedTab);
    }
  });
  
  let filteredOperations = $state([]);
  
  // Function to select an operation
  function selectOperation(operation) {
    selectedOperation = operation;
  }
  
  // Function to create a new operation
  function createOperation() {
    const operationType = operationTypes.find(type => type.id === newOperationType);
    
    if (!operationType) return;
    
    // Create operation data based on type
    let data = {};
    
    switch (newOperationType) {
      case 'loan_approval':
        data = {
          amount: parseFloat(newOperationData.amount) || 0,
          term: parseInt(newOperationData.term) || 0,
          purpose: newOperationData.purpose || '',
          interestRate: parseFloat(newOperationData.interestRate) || 0
        };
        break;
      case 'transfer':
        data = {
          amount: parseFloat(newOperationData.amount) || 0,
          fromAccount: newOperationData.fromAccount || '',
          toAccount: newOperationData.toAccount || '',
          description: newOperationData.description || ''
        };
        break;
      case 'withdrawal':
      case 'deposit':
        data = {
          amount: parseFloat(newOperationData.amount) || 0,
          account: newOperationData.account || '',
          description: newOperationData.description || ''
        };
        break;
      case 'account_opening':
        data = {
          accountType: newOperationData.accountType || '',
          initialDeposit: parseFloat(newOperationData.initialDeposit) || 0,
          currency: newOperationData.currency || 'USD'
        };
        break;
      case 'card_issuance':
        data = {
          cardType: newOperationData.cardType || '',
          account: newOperationData.account || '',
          deliveryAddress: newOperationData.deliveryAddress || ''
        };
        break;
    }
    
    // Request operation
    requestOperation(newOperationType, data);
    
    // Add operation to local operations for immediate display
    operations.update(ops => [
      {
        id: `local-${Date.now()}`,
        type: newOperationType,
        requesterId: 'currentUser',
        status: 'pending',
        data,
        createdAt: new Date().toISOString()
      },
      ...ops
    ]);
    
    // Reset form
    newOperationData = {};
    
    // Close form
    showNewOperationForm = false;
  }
  
  // Function to approve an operation
  function approveOperation(operation) {
    operations.update(ops => 
      ops.map(op => 
        op.id === operation.id 
          ? { ...op, status: 'approved', approverId: 'currentUser', updatedAt: new Date().toISOString() } 
          : op
      )
    );
  }
  
  // Function to reject an operation
  function rejectOperation(operation) {
    operations.update(ops => 
      ops.map(op => 
        op.id === operation.id 
          ? { ...op, status: 'rejected', approverId: 'currentUser', updatedAt: new Date().toISOString() } 
          : op
      )
    );
  }
  
  let showNewOperationForm = $state(false);
  
  // Get operation type name
  function getOperationTypeName(typeId) {
    const type = operationTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  }
  
  // Get operation department
  function getOperationDepartment(typeId) {
    const type = operationTypes.find(t => t.id === typeId);
    return type ? type.department : '';
  }
  
  // Format operation data for display
  function formatOperationData(operation) {
    const { type, data } = operation;
    
    if (!data) return '';
    
    switch (type) {
      case 'loan_approval':
        return `Amount: $${data.amount}, Term: ${data.term} months, Purpose: ${data.purpose}`;
      case 'transfer':
        return `Amount: $${data.amount}, From: ${data.fromAccount}, To: ${data.toAccount}`;
      case 'withdrawal':
      case 'deposit':
        return `Amount: $${data.amount}, Account: ${data.account}`;
      case 'account_opening':
        return `Type: ${data.accountType}, Initial Deposit: $${data.initialDeposit}, Currency: ${data.currency}`;
      case 'card_issuance':
        return `Card Type: ${data.cardType}, Account: ${data.account}`;
      default:
        return JSON.stringify(data);
    }
  }
  
  // Initialize with some demo operations if there are none
  onMount(() => {
    if ($operations.length === 0) {
      operations.set([
        {
          id: 1,
          type: 'loan_approval',
          requesterId: 'user1',
          status: 'pending',
          data: { amount: 50000, term: 60, purpose: 'Home renovation', interestRate: 4.5 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'transfer',
          requesterId: 'user2',
          status: 'approved',
          approverId: 'user3',
          data: { amount: 5000, fromAccount: '1234567890', toAccount: '0987654321', description: 'Monthly payment' },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          type: 'withdrawal',
          requesterId: 'user3',
          status: 'completed',
          approverId: 'user1',
          data: { amount: 1000, account: '1234567890', description: 'ATM withdrawal' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 82800000).toISOString(),
          completedAt: new Date(Date.now() - 82800000).toISOString()
        }
      ]);
    }
  });
</script>

<div class="operations-container">
  <div class="operations-header">
    <div class="tabs">
      <button 
        class="tab-btn {selectedTab === 'all' ? 'active' : ''}" 
        onclick={() => selectedTab = 'all'}
      >
        All Operations
      </button>
      <button 
        class="tab-btn {selectedTab === 'pending' ? 'active' : ''}" 
        onclick={() => selectedTab = 'pending'}
      >
        Pending
        {#if $operations.filter(op => op.status === 'pending').length > 0}
          <span class="badge">{$operations.filter(op => op.status === 'pending').length}</span>
        {/if}
      </button>
      <button 
        class="tab-btn {selectedTab === 'approved' ? 'active' : ''}" 
        onclick={() => selectedTab = 'approved'}
      >
        Approved
      </button>
      <button 
        class="tab-btn {selectedTab === 'rejected' ? 'active' : ''}" 
        onclick={() => selectedTab = 'rejected'}
      >
        Rejected
      </button>
    </div>
    
    <button class="new-operation-btn" onclick={() => showNewOperationForm = !showNewOperationForm}>
      {showNewOperationForm ? 'Cancel' : 'New Operation'}
    </button>
  </div>
  
  {#if showNewOperationForm}
    <div class="new-operation-form">
      <h3>Create New Operation</h3>
      
      <div class="form-group">
        <label for="operation-type">Operation Type</label>
        <select id="operation-type" bind:value={newOperationType}>
          {#each operationTypes as type}
            <option value={type.id}>{type.name} ({type.department})</option>
          {/each}
        </select>
      </div>
      
      {#if newOperationType === 'loan_approval'}
        <div class="form-group">
          <label for="loan-amount">Loan Amount</label>
          <input id="loan-amount" type="number" bind:value={newOperationData.amount} placeholder="Enter amount" />
        </div>
        <div class="form-group">
          <label for="loan-term">Term (months)</label>
          <input id="loan-term" type="number" bind:value={newOperationData.term} placeholder="Enter term" />
        </div>
        <div class="form-group">
          <label for="loan-purpose">Purpose</label>
          <input id="loan-purpose" type="text" bind:value={newOperationData.purpose} placeholder="Enter purpose" />
        </div>
        <div class="form-group">
          <label for="loan-interest">Interest Rate (%)</label>
          <input id="loan-interest" type="number" step="0.1" bind:value={newOperationData.interestRate} placeholder="Enter interest rate" />
        </div>
      {:else if newOperationType === 'transfer'}
        <div class="form-group">
          <label for="transfer-amount">Amount</label>
          <input id="transfer-amount" type="number" bind:value={newOperationData.amount} placeholder="Enter amount" />
        </div>
        <div class="form-group">
          <label for="from-account">From Account</label>
          <input id="from-account" type="text" bind:value={newOperationData.fromAccount} placeholder="Enter account number" />
        </div>
        <div class="form-group">
          <label for="to-account">To Account</label>
          <input id="to-account" type="text" bind:value={newOperationData.toAccount} placeholder="Enter account number" />
        </div>
        <div class="form-group">
          <label for="transfer-description">Description</label>
          <input id="transfer-description" type="text" bind:value={newOperationData.description} placeholder="Enter description" />
        </div>
      {:else if newOperationType === 'withdrawal' || newOperationType === 'deposit'}
        <div class="form-group">
          <label for="cash-amount">Amount</label>
          <input id="cash-amount" type="number" bind:value={newOperationData.amount} placeholder="Enter amount" />
        </div>
        <div class="form-group">
          <label for="cash-account">Account</label>
          <input id="cash-account" type="text" bind:value={newOperationData.account} placeholder="Enter account number" />
        </div>
        <div class="form-group">
          <label for="cash-description">Description</label>
          <input id="cash-description" type="text" bind:value={newOperationData.description} placeholder="Enter description" />
        </div>
      {:else if newOperationType === 'account_opening'}
        <div class="form-group">
          <label for="account-type">Account Type</label>
          <select id="account-type" bind:value={newOperationData.accountType}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div class="form-group">
          <label for="initial-deposit">Initial Deposit</label>
          <input id="initial-deposit" type="number" bind:value={newOperationData.initialDeposit} placeholder="Enter amount" />
        </div>
        <div class="form-group">
          <label for="currency">Currency</label>
          <select id="currency" bind:value={newOperationData.currency}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      {:else if newOperationType === 'card_issuance'}
        <div class="form-group">
          <label for="card-type">Card Type</label>
          <select id="card-type" bind:value={newOperationData.cardType}>
            <option value="debit">Debit Card</option>
            <option value="credit">Credit Card</option>
            <option value="prepaid">Prepaid Card</option>
          </select>
        </div>
        <div class="form-group">
          <label for="card-account">Account</label>
          <input id="card-account" type="text" bind:value={newOperationData.account} placeholder="Enter account number" />
        </div>
        <div class="form-group">
          <label for="delivery-address">Delivery Address</label>
          <textarea id="delivery-address" bind:value={newOperationData.deliveryAddress} placeholder="Enter delivery address"></textarea>
        </div>
      {/if}
      
      <div class="form-actions">
        <button class="cancel-btn" onclick={() => showNewOperationForm = false}>Cancel</button>
        <button class="submit-btn" onclick={createOperation}>Create Operation</button>
      </div>
    </div>
  {:else}
    <div class="operations-content">
      <div class="operations-list">
        {#if filteredOperations.length === 0}
          <div class="no-operations">
            <p>No operations found</p>
          </div>
        {:else}
          {#each filteredOperations as operation}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="operation-item {selectedOperation && selectedOperation.id === operation.id ? 'selected' : ''} status-{operation.status}"
              onclick={() => selectOperation(operation)}
            >
              <div class="operation-header">
                <div class="operation-type">{getOperationTypeName(operation.type)}</div>
                <div class="operation-status">{operation.status}</div>
              </div>
              <div class="operation-department">{getOperationDepartment(operation.type)}</div>
              <div class="operation-data">{formatOperationData(operation)}</div>
              <div class="operation-time">
                Created: {new Date(operation.createdAt).toLocaleString()}
              </div>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="operation-details">
        {#if selectedOperation}
          <div class="details-header">
            <h3>{getOperationTypeName(selectedOperation.type)} Operation</h3>
            <div class="status-badge status-{selectedOperation.status}">{selectedOperation.status}</div>
          </div>
          
          <div class="details-content">
            <div class="detail-group">
              <div class="detail-label">Department</div>
              <div class="detail-value">{getOperationDepartment(selectedOperation.type)}</div>
            </div>
            
            <div class="detail-group">
              <div class="detail-label">Requester</div>
              <div class="detail-value">{selectedOperation.requesterId}</div>
            </div>
            
            <div class="detail-group">
              <div class="detail-label">Created At</div>
              <div class="detail-value">{new Date(selectedOperation.createdAt).toLocaleString()}</div>
            </div>
            
            {#if selectedOperation.updatedAt}
              <div class="detail-group">
                <div class="detail-label">Updated At</div>
                <div class="detail-value">{new Date(selectedOperation.updatedAt).toLocaleString()}</div>
              </div>
            {/if}
            
            {#if selectedOperation.approverId}
              <div class="detail-group">
                <div class="detail-label">Approver</div>
                <div class="detail-value">{selectedOperation.approverId}</div>
              </div>
            {/if}
            
            {#if selectedOperation.completedAt}
              <div class="detail-group">
                <div class="detail-label">Completed At</div>
                <div class="detail-value">{new Date(selectedOperation.completedAt).toLocaleString()}</div>
              </div>
            {/if}
            
            <div class="detail-group">
              <div class="detail-label">Details</div>
              <div class="detail-value operation-details-data">
                {#if selectedOperation.type === 'loan_approval'}
                  <div>Amount: ${selectedOperation.data.amount}</div>
                  <div>Term: {selectedOperation.data.term} months</div>
                  <div>Purpose: {selectedOperation.data.purpose}</div>
                  <div>Interest Rate: {selectedOperation.data.interestRate}%</div>
                {:else if selectedOperation.type === 'transfer'}
                  <div>Amount: ${selectedOperation.data.amount}</div>
                  <div>From Account: {selectedOperation.data.fromAccount}</div>
                  <div>To Account: {selectedOperation.data.toAccount}</div>
                  <div>Description: {selectedOperation.data.description}</div>
                {:else if selectedOperation.type === 'withdrawal' || selectedOperation.type === 'deposit'}
                  <div>Amount: ${selectedOperation.data.amount}</div>
                  <div>Account: {selectedOperation.data.account}</div>
                  <div>Description: {selectedOperation.data.description}</div>
                {:else if selectedOperation.type === 'account_opening'}
                  <div>Account Type: {selectedOperation.data.accountType}</div>
                  <div>Initial Deposit: ${selectedOperation.data.initialDeposit}</div>
                  <div>Currency: {selectedOperation.data.currency}</div>
                {:else if selectedOperation.type === 'card_issuance'}
                  <div>Card Type: {selectedOperation.data.cardType}</div>
                  <div>Account: {selectedOperation.data.account}</div>
                  <div>Delivery Address: {selectedOperation.data.deliveryAddress}</div>
                {:else}
                  <pre>{JSON.stringify(selectedOperation.data, null, 2)}</pre>
                {/if}
              </div>
            </div>
            
            {#if selectedOperation.status === 'pending'}
              <div class="operation-actions">
                <button class="reject-btn" onclick={() => rejectOperation(selectedOperation)}>Reject</button>
                <button class="approve-btn" onclick={() => approveOperation(selectedOperation)}>Approve</button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="no-operation-selected">
            <p>Select an operation to view details</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .operations-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .operations-header {
    padding: 10px 15px;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
  }
  
  .tabs {
    display: flex;
  }
  
  .tab-btn {
    padding: 8px 15px;
    border: none;
    background-color: transparent;
    cursor: pointer;
    position: relative;
    border-radius: 4px;
    margin-right: 5px;
  }
  
  .tab-btn.active {
    background-color: #e3f2fd;
    font-weight: bold;
  }
  
  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #FF5722;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transform: translate(50%, -50%);
  }
  
  .new-operation-btn {
    padding: 8px 15px;
    background-color: #1976D2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .new-operation-btn:hover {
    background-color: #1565C0;
  }
  
  .new-operation-form {
    padding: 20px;
    border-bottom: 1px solid #ddd;
    background-color: #f9f9f9;
  }
  
  .new-operation-form h3 {
    margin-top: 0;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .form-group textarea {
    height: 80px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  
  .cancel-btn {
    padding: 8px 15px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
  }
  
  .submit-btn {
    padding: 8px 15px;
    background-color: #1976D2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .operations-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .operations-list {
    width: 350px;
    border-right: 1px solid #ddd;
    overflow-y: auto;
  }
  
  .no-operations,
  .no-operation-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #777;
  }
  
  .operation-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }
  
  .operation-item:hover {
    background-color: #f9f9f9;
  }
  
  .operation-item.selected {
    background-color: #e3f2fd;
  }
  
  .operation-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  
  .operation-type {
    font-weight: bold;
  }
  
  .operation-status {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 10px;
    text-transform: uppercase;
  }
  
  .status-pending .operation-status {
    background-color: #FFC107;
    color: #000;
  }
  
  .status-approved .operation-status {
    background-color: #4CAF50;
    color: white;
  }
  
  .status-rejected .operation-status {
    background-color: #F44336;
    color: white;
  }
  
  .status-completed .operation-status {
    background-color: #2196F3;
    color: white;
  }
  
  .operation-department {
    font-size: 12px;
    color: #777;
    margin-bottom: 5px;
  }
  
  .operation-data {
    margin-bottom: 10px;
    font-size: 14px;
  }
  
  .operation-time {
    font-size: 12px;
    color: #777;
  }
  
  .operation-details {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .details-header h3 {
    margin: 0;
  }
  
  .status-badge {
    padding: 5px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 12px;
  }
  
  .status-badge.status-pending {
    background-color: #FFC107;
    color: #000;
  }
  
  .status-badge.status-approved {
    background-color: #4CAF50;
    color: white;
  }
  
  .status-badge.status-rejected {
    background-color: #F44336;
    color: white;
  }
  
  .status-badge.status-completed {
    background-color: #2196F3;
    color: white;
  }
  
  .details-content {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 20px;
  }
  
  .detail-group {
    margin-bottom: 15px;
  }
  
  .detail-label {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .detail-value {
    padding: 5px 0;
  }
  
  .operation-details-data {
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
  }
  
  .operation-details-data div {
    margin-bottom: 5px;
  }
  
  .operation-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
  
  .reject-btn {
    padding: 8px 15px;
    background-color: #F44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
  }
  
  .approve-btn {
    padding: 8px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
