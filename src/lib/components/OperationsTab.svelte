<script>
  import { onMount } from 'svelte';
  import { operations, requestOperation } from '$lib/websocket-client';

  // Operation types
  const operationTypes = [
    { id: 'loan_approval', name: 'Одобрение кредита', department: 'Кредиты' },
    { id: 'transfer', name: 'Денежный перевод', department: 'Переводы' },
    { id: 'withdrawal', name: 'Снятие наличных', department: 'Касса' },
    { id: 'deposit', name: 'Внесение наличных', department: 'Касса' },
    { id: 'account_opening', name: 'Открытие счета', department: 'Счета' },
    { id: 'card_issuance', name: 'Выпуск карты', department: 'Карты' }
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
      filteredOperations = $operations.filter((op) => op.status === selectedTab);
    }
  });

  let filteredOperations = $state([]);

  // Function to select an operation
  function selectOperation(operation) {
    selectedOperation = operation;
  }

  // Function to create a new operation
  function createOperation() {
    const operationType = operationTypes.find((type) => type.id === newOperationType);

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
    operations.update((ops) => [
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
    operations.update((ops) =>
      ops.map((op) =>
        op.id === operation.id
          ? {
              ...op,
              status: 'approved',
              approverId: 'currentUser',
              updatedAt: new Date().toISOString()
            }
          : op
      )
    );
  }

  // Function to reject an operation
  function rejectOperation(operation) {
    operations.update((ops) =>
      ops.map((op) =>
        op.id === operation.id
          ? {
              ...op,
              status: 'rejected',
              approverId: 'currentUser',
              updatedAt: new Date().toISOString()
            }
          : op
      )
    );
  }

  let showNewOperationForm = $state(false);

  // Get operation type name
  function getOperationTypeName(typeId) {
    const type = operationTypes.find((t) => t.id === typeId);
    return type ? type.name : typeId;
  }

  // Get operation department
  function getOperationDepartment(typeId) {
    const type = operationTypes.find((t) => t.id === typeId);
    return type ? type.department : '';
  }

  // Format operation data for display
  function formatOperationData(operation) {
    const { type, data } = operation;

    if (!data) return '';

    switch (type) {
      case 'loan_approval':
        return `Сумма: $${data.amount}, Срок: ${data.term} мес., Цель: ${data.purpose}`;
      case 'transfer':
        return `Сумма: $${data.amount}, С: ${data.fromAccount}, Кому: ${data.toAccount}`;
      case 'withdrawal':
      case 'deposit':
        return `Сумма: $${data.amount}, Счет: ${data.account}`;
      case 'account_opening':
        return `Тип: ${data.accountType}, Взнос: $${data.initialDeposit}, Валюта: ${data.currency}`;
      case 'card_issuance':
        return `Тип карты: ${data.cardType}, Счет: ${data.account}`;
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
          data: { amount: 50000, term: 60, purpose: 'Ремонт жилья', interestRate: 4.5 },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'transfer',
          requesterId: 'user2',
          status: 'approved',
          approverId: 'user3',
          data: {
            amount: 5000,
            fromAccount: '1234567890',
            toAccount: '0987654321',
            description: 'Ежемесячный платеж'
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          type: 'withdrawal',
          requesterId: 'user3',
          status: 'completed',
          approverId: 'user1',
          data: { amount: 1000, account: '1234567890', description: 'Снятие в банкомате' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 82800000).toISOString(),
          completedAt: new Date(Date.now() - 82800000).toISOString()
        }
      ]);
    }
  });
</script>

<div class="border-base-200 bg-base-100 flex h-full flex-col overflow-hidden rounded-lg border">
  <div class="border-base-200 bg-base-200 flex items-center justify-between border-b px-4 py-2">
    <div class="tabs tabs-boxed">
      <button
        class="tab {selectedTab === 'all' ? 'tab-active' : ''}"
        onclick={() => (selectedTab = 'all')}
      >
        Все операции
      </button>
      <button
        class="tab {selectedTab === 'pending' ? 'tab-active' : ''}"
        onclick={() => (selectedTab = 'pending')}
      >
        Ожидание
        {#if $operations.filter((op) => op.status === 'pending').length > 0}
          <span class="badge badge-warning ml-2"
            >{$operations.filter((op) => op.status === 'pending').length}</span
          >
        {/if}
      </button>
      <button
        class="tab {selectedTab === 'approved' ? 'tab-active' : ''}"
        onclick={() => (selectedTab = 'approved')}
      >
        Одобрено
      </button>
      <button
        class="tab {selectedTab === 'rejected' ? 'tab-active' : ''}"
        onclick={() => (selectedTab = 'rejected')}
      >
        Отклонено
      </button>
    </div>

    <button class="btn btn-primary" onclick={() => (showNewOperationForm = !showNewOperationForm)}>
      {showNewOperationForm ? 'Отмена' : 'Новая операция'}
    </button>
  </div>

  {#if showNewOperationForm}
    <div class="bg-base-100 border-base-200 border-b p-6">
      <h3 class="mb-4 text-lg font-semibold">Создать новую операцию</h3>

      <div class="mb-4">
        <label class="mb-2 block font-medium" for="operation-type">Тип операции</label>
        <select
          id="operation-type"
          class="select select-bordered w-full"
          bind:value={newOperationType}
        >
          {#each operationTypes as type}
            <option value={type.id}>{type.name} ({type.department})</option>
          {/each}
        </select>
      </div>

      {#if newOperationType === 'loan_approval'}
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="loan-amount">Сумма кредита</label>
          <input
            id="loan-amount"
            type="number"
            class="input input-bordered w-full"
            bind:value={newOperationData.amount}
            placeholder="Введите сумму"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="loan-term">Срок (мес.)</label>
          <input
            id="loan-term"
            type="number"
            class="input input-bordered w-full"
            bind:value={newOperationData.term}
            placeholder="Введите срок"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="loan-purpose">Цель</label>
          <input
            id="loan-purpose"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.purpose}
            placeholder="Введите цель"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="loan-interest">Процентная ставка (%)</label>
          <input
            id="loan-interest"
            type="number"
            step="0.1"
            class="input input-bordered w-full"
            bind:value={newOperationData.interestRate}
            placeholder="Введите процент"
          />
        </div>
      {:else if newOperationType === 'transfer'}
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="transfer-amount">Сумма</label>
          <input
            id="transfer-amount"
            type="number"
            class="input input-bordered w-full"
            bind:value={newOperationData.amount}
            placeholder="Введите сумму"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="from-account">Со счета</label>
          <input
            id="from-account"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.fromAccount}
            placeholder="Введите номер счета"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="to-account">На счет</label>
          <input
            id="to-account"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.toAccount}
            placeholder="Введите номер счета"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="transfer-description">Описание</label>
          <input
            id="transfer-description"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.description}
            placeholder="Введите описание"
          />
        </div>
      {:else if newOperationType === 'withdrawal' || newOperationType === 'deposit'}
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="cash-amount">Сумма</label>
          <input
            id="cash-amount"
            type="number"
            class="input input-bordered w-full"
            bind:value={newOperationData.amount}
            placeholder="Введите сумму"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="cash-account">Счет</label>
          <input
            id="cash-account"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.account}
            placeholder="Введите номер счета"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="cash-description">Описание</label>
          <input
            id="cash-description"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.description}
            placeholder="Введите описание"
          />
        </div>
      {:else if newOperationType === 'account_opening'}
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="account-type">Тип счета</label>
          <select
            id="account-type"
            class="select select-bordered w-full"
            bind:value={newOperationData.accountType}
          >
            <option value="checking">Текущий</option>
            <option value="savings">Сберегательный</option>
            <option value="business">Бизнес</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="initial-deposit">Начальный взнос</label>
          <input
            id="initial-deposit"
            type="number"
            class="input input-bordered w-full"
            bind:value={newOperationData.initialDeposit}
            placeholder="Введите сумму"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="currency">Валюта</label>
          <select
            id="currency"
            class="select select-bordered w-full"
            bind:value={newOperationData.currency}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      {:else if newOperationType === 'card_issuance'}
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="card-type">Тип карты</label>
          <select
            id="card-type"
            class="select select-bordered w-full"
            bind:value={newOperationData.cardType}
          >
            <option value="debit">Дебетовая</option>
            <option value="credit">Кредитная</option>
            <option value="prepaid">Предоплаченная</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="card-account">Счет</label>
          <input
            id="card-account"
            type="text"
            class="input input-bordered w-full"
            bind:value={newOperationData.account}
            placeholder="Введите номер счета"
          />
        </div>
        <div class="mb-4">
          <label class="mb-2 block font-medium" for="delivery-address">Адрес доставки</label>
          <textarea
            id="delivery-address"
            class="textarea textarea-bordered w-full"
            bind:value={newOperationData.deliveryAddress}
            placeholder="Введите адрес доставки"
          ></textarea>
        </div>
      {/if}

      <div class="mt-6 flex justify-end gap-2">
        <button class="btn" onclick={() => (showNewOperationForm = false)}>Отмена</button>
        <button class="btn btn-primary" onclick={createOperation}>Создать операцию</button>
      </div>
    </div>
  {:else}
    <div class="flex flex-1 overflow-hidden">
      <div class="border-base-200 w-[350px] overflow-y-auto border-r">
        {#if filteredOperations.length === 0}
          <div class="text-base-content/60 flex min-h-[200px] items-center justify-center">
            <p>Операции не найдены</p>
          </div>
        {:else}
          {#each filteredOperations as operation}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="border-base-200 hover:bg-base-200 cursor-pointer border-b p-4 transition-colors {selectedOperation &&
              selectedOperation.id === operation.id
                ? 'bg-primary text-primary-content'
                : ''} status-{operation.status}"
              onclick={() => selectOperation(operation)}
            >
              <div class="mb-2 flex justify-between">
                <div class="font-semibold">{getOperationTypeName(operation.type)}</div>
                <div
                  class="badge badge-sm {operation.status === 'pending'
                    ? 'badge-warning'
                    : operation.status === 'approved'
                      ? 'badge-success'
                      : operation.status === 'rejected'
                        ? 'badge-error'
                        : 'badge-info'}"
                >
                  {operation.status}
                </div>
              </div>
              <div class="mb-1 text-xs opacity-60">{getOperationDepartment(operation.type)}</div>
              <div class="mb-2 text-sm">{formatOperationData(operation)}</div>
              <div class="text-xs opacity-60">
                Создано: {new Date(operation.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        {#if selectedOperation}
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">{getOperationTypeName(selectedOperation.type)}</h3>
            <div
              class="badge {selectedOperation.status === 'pending'
                ? 'badge-warning'
                : selectedOperation.status === 'approved'
                  ? 'badge-success'
                  : selectedOperation.status === 'rejected'
                    ? 'badge-error'
                    : 'badge-info'}"
            >
              {selectedOperation.status}
            </div>
          </div>

          <div class="bg-base-100 border-base-200 rounded-lg border p-4">
            <div class="mb-4">
              <div class="text-base-content/60 mb-1 text-sm font-medium">Отдел</div>
              <div>{getOperationDepartment(selectedOperation.type)}</div>
            </div>

            <div class="mb-4">
              <div class="text-base-content/60 mb-1 text-sm font-medium">Запросил</div>
              <div>{selectedOperation.requesterId}</div>
            </div>

            <div class="mb-4">
              <div class="text-base-content/60 mb-1 text-sm font-medium">Создано</div>
              <div>{new Date(selectedOperation.createdAt).toLocaleString('ru-RU')}</div>
            </div>

            {#if selectedOperation.updatedAt}
              <div class="mb-4">
                <div class="text-base-content/60 mb-1 text-sm font-medium">Обновлено</div>
                <div>{new Date(selectedOperation.updatedAt).toLocaleString('ru-RU')}</div>
              </div>
            {/if}

            {#if selectedOperation.approverId}
              <div class="mb-4">
                <div class="text-base-content/60 mb-1 text-sm font-medium">Одобрил</div>
                <div>{selectedOperation.approverId}</div>
              </div>
            {/if}

            {#if selectedOperation.completedAt}
              <div class="mb-4">
                <div class="text-base-content/60 mb-1 text-sm font-medium">Завершено</div>
                <div>{new Date(selectedOperation.completedAt).toLocaleString('ru-RU')}</div>
              </div>
            {/if}

            <div class="mb-4">
              <div class="text-base-content/60 mb-1 text-sm font-medium">Детали</div>
              <div class="bg-base-200 rounded px-3 py-2">
                {#if selectedOperation.type === 'loan_approval'}
                  <div>Сумма: ${selectedOperation.data.amount}</div>
                  <div>Срок: {selectedOperation.data.term} мес.</div>
                  <div>Цель: {selectedOperation.data.purpose}</div>
                  <div>Процентная ставка: {selectedOperation.data.interestRate}%</div>
                {:else if selectedOperation.type === 'transfer'}
                  <div>Сумма: ${selectedOperation.data.amount}</div>
                  <div>Со счета: {selectedOperation.data.fromAccount}</div>
                  <div>На счет: {selectedOperation.data.toAccount}</div>
                  <div>Описание: {selectedOperation.data.description}</div>
                {:else if selectedOperation.type === 'withdrawal' || selectedOperation.type === 'deposit'}
                  <div>Сумма: ${selectedOperation.data.amount}</div>
                  <div>Счет: {selectedOperation.data.account}</div>
                  <div>Описание: {selectedOperation.data.description}</div>
                {:else if selectedOperation.type === 'account_opening'}
                  <div>Тип счета: {selectedOperation.data.accountType}</div>
                  <div>Начальный взнос: ${selectedOperation.data.initialDeposit}</div>
                  <div>Валюта: {selectedOperation.data.currency}</div>
                {:else if selectedOperation.type === 'card_issuance'}
                  <div>Тип карты: {selectedOperation.data.cardType}</div>
                  <div>Счет: {selectedOperation.data.account}</div>
                  <div>Адрес доставки: {selectedOperation.data.deliveryAddress}</div>
                {:else}
                  <pre>{JSON.stringify(selectedOperation.data, null, 2)}</pre>
                {/if}
              </div>
            </div>

            {#if selectedOperation.status === 'pending'}
              <div class="border-base-200 mt-4 flex justify-end gap-2 border-t pt-4">
                <button class="btn btn-error" onclick={() => rejectOperation(selectedOperation)}
                  >Отклонить</button
                >
                <button class="btn btn-success" onclick={() => approveOperation(selectedOperation)}
                  >Одобрить</button
                >
              </div>
            {/if}
          </div>
        {:else}
          <div class="text-base-content/60 flex h-full items-center justify-center">
            <p>Выберите операцию для просмотра подробностей</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
