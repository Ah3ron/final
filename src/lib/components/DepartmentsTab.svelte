<script>
  import { onMount } from 'svelte';
  import {
    departmentMessages,
    joinDepartment,
    leaveDepartment,
    sendDepartmentMessage
  } from '$lib/websocket-client';

  // Демонстрационные отделы
  const departments = [
    { id: 1, name: 'Кредиты', description: 'Оформление и утверждение кредитов' },
    { id: 2, name: 'Переводы', description: 'Операции по переводам денежных средств' },
    { id: 3, name: 'Касса', description: 'Кассовые операции и управление' },
    { id: 4, name: 'Счета', description: 'Управление счетами и обслуживание' },
    { id: 5, name: 'Карты', description: 'Обслуживание кредитных и дебетовых карт' }
  ];

  let selectedDepartment = $state(null);
  let messageInput = $state('');
  let departmentMembers = $state([]);

  function selectDepartment(department) {
    if (selectedDepartment) {
      leaveDepartment(selectedDepartment.id);
    }
    selectedDepartment = department;
    joinDepartment(department.id);
    // Демонстрационные участники отдела
    departmentMembers = [
      { userId: 'user1', username: 'Иван Иванов', position: 'Руководитель отдела' },
      { userId: 'user2', username: 'Ольга Смирнова', position: 'Ведущий специалист' },
      { userId: 'user3', username: 'Павел Петров', position: 'Специалист' }
    ];
  }

  function handleSendMessage() {
    if (!messageInput.trim() || !selectedDepartment) return;

    sendDepartmentMessage(selectedDepartment.id, messageInput);

    departmentMessages.update((deptMsgs) => {
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

  onMount(() => {
    departmentMessages.update((deptMsgs) => {
      return {
        1: [
          {
            messageId: 'dept1-msg1',
            senderId: 'user1',
            departmentId: 1,
            content: 'Коллеги, необходимо пересмотреть процесс одобрения кредитов.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            messageId: 'dept1-msg2',
            senderId: 'user2',
            departmentId: 1,
            content: 'Я подготовила документацию по обновленному процессу.',
            timestamp: new Date(Date.now() - 3500000).toISOString()
          }
        ],
        2: [
          {
            messageId: 'dept2-msg1',
            senderId: 'user3',
            departmentId: 2,
            content:
              'Сегодня ночью система международных переводов будет недоступна из-за техобслуживания.',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        ...deptMsgs
      };
    });
  });
</script>

<div class="border-base-200 bg-base-100 flex h-full overflow-hidden rounded-lg border">
  <!-- Sidebar -->
  <div class="bg-base-200 border-base-300 flex w-64 flex-col border-r">
    <h3 class="border-base-300 m-0 flex items-center gap-2 border-b p-4 text-lg font-bold">
      <span class="i-heroicons-building-office-2">Отделы</span>
    </h3>
    <ul class="flex-1 overflow-y-auto">
      {#each departments as department}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li
          class={`border-base-300 hover:bg-base-300 cursor-pointer border-b px-4 py-3 transition-colors ${
            selectedDepartment && selectedDepartment.id === department.id
              ? 'bg-primary text-primary-content'
              : ''
          }`}
          onclick={() => selectDepartment(department)}
          tabindex="0"
        >
          <div class="font-semibold">{department.name}</div>
          <div class="text-xs opacity-70">{department.description}</div>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Main Content -->
  <div class="bg-base-100 flex flex-1 flex-col">
    {#if selectedDepartment}
      <div class="border-base-200 bg-base-100 border-b p-6">
        <h2 class="mb-2 text-2xl font-bold">{selectedDepartment.name}</h2>
        <p class="text-base-content/70">{selectedDepartment.description}</p>
      </div>

      <div class="flex min-h-0 flex-1">
        <!-- Chat -->
        <div class="border-base-200 flex flex-1 flex-col border-r">
          <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {#if !$departmentMessages[selectedDepartment.id] || $departmentMessages[selectedDepartment.id].length === 0}
              <div class="text-base-content/60 flex min-h-[120px] items-center justify-center">
                <p>В этом отделе пока нет сообщений.</p>
              </div>
            {:else}
              {#each $departmentMessages[selectedDepartment.id] as message}
                <div
                  class={`chat ${message.senderId === 'currentUser' ? 'chat-end' : 'chat-start'}`}
                >
                  <div
                    class={`chat-bubble ${message.senderId === 'currentUser' ? 'bg-primary text-primary-content' : 'bg-base-200'}`}
                  >
                    <div class="mb-1 text-xs font-medium">
                      {message.senderId === 'currentUser' ? 'Вы' : message.senderId}
                    </div>
                    <div>{message.content}</div>
                    <div class="mt-1 text-right text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <form
            class="bg-base-100 border-base-200 flex gap-2 border-t p-4"
            onsubmit={handleSendMessage}
          >
            <input
              type="text"
              placeholder="Напишите сообщение в отдел..."
              class="input input-bordered flex-1"
              bind:value={messageInput}
              onkeydown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button type="submit" class="btn btn-primary">Отправить</button>
          </form>
        </div>

        <!-- Department Members -->
        <div class="border-base-200 bg-base-100 flex w-64 flex-col border-l p-4">
          <h3 class="border-base-200 mb-4 border-b pb-2 font-semibold">
            Участники ({departmentMembers.length})
          </h3>
          <ul class="flex-1 overflow-y-auto">
            {#each departmentMembers as member}
              <li class="mb-4 last:mb-0">
                <div class="font-semibold">{member.username}</div>
                <div class="text-xs opacity-70">{member.position}</div>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {:else}
      <div class="text-base-content/70 flex flex-1 items-center justify-center">
        <p>Выберите отдел, чтобы просмотреть подробности и начать чат</p>
      </div>
    {/if}
  </div>
</div>
