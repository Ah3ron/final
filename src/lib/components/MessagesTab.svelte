<script>
  import { onMount } from 'svelte';
  import { messages, onlineUsers, sendDirectMessage } from '$lib/websocket-client';

  let selectedUser = $state(null);
  let messageInput = $state('');
  let userMessages = $state([]);

  // Derived value for current conversation messages
  $effect(() => {
    if (selectedUser) {
      userMessages = $messages
        .filter(
          (msg) =>
            (msg.senderId === selectedUser.userId && msg.recipientId === 'currentUser') ||
            (msg.senderId === 'currentUser' && msg.recipientId === selectedUser.userId)
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      userMessages = [];
    }
  });

  // Function to send a message
  function handleSendMessage() {
    if (!messageInput.trim() || !selectedUser) return;
    sendDirectMessage(selectedUser.userId, messageInput);
    // Add message to local messages for immediate display
    messages.update((msgs) => [
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

  // Add demo messages/users if none exist
  onMount(() => {
    if ($messages.length === 0) {
      messages.set([
        {
          messageId: 'demo-1',
          senderId: 'user1',
          recipientId: 'currentUser',
          content: 'Здравствуйте! Можете обсудить процесс одобрения кредита?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false
        },
        {
          messageId: 'demo-2',
          senderId: 'user2',
          recipientId: 'currentUser',
          content: 'Нужна ваша подпись для подтверждения перевода.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true
        }
      ]);
    }
    if ($onlineUsers.length === 0) {
      onlineUsers.set([
        { userId: 'user1', username: 'Иван Ив��нов' },
        { userId: 'user2', username: 'Ольга Смирнова' }
      ]);
    }
  });
</script>

<div class="border-base-200 bg-base-100 flex h-full overflow-hidden rounded-lg border">
  <!-- Sidebar -->
  <div class="bg-base-200 border-base-300 flex w-64 flex-col border-r">
    <h3 class="border-base-300 m-0 flex items-center gap-2 border-b p-4 text-lg font-bold">
      <span class="i-heroicons-user-group"> Онлайн пользователи</span>
    </h3>
    <div class="border-base-300 border-b p-3">
      <input type="text" placeholder="Поиск..." class="input input-bordered w-full" />
    </div>
    <ul class="flex-1 overflow-y-auto">
      {#each $onlineUsers as user}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li
          class={`border-base-200 hover:bg-base-300 flex cursor-pointer items-center gap-2 border-b px-4 py-3 transition-colors ${
            selectedUser && selectedUser.userId === user.userId
              ? 'bg-primary text-primary-content'
              : ''
          }`}
          onclick={() => selectUser(user)}
          tabindex="0"
        >
          <span class="bg-success mr-2 h-3 w-3 rounded-full"></span>
          <span class="flex-1">{user.username || user.userId}</span>
          {#if $messages.some((m) => m.senderId === user.userId && !m.isRead)}
            <span class="bg-warning h-2 w-2 rounded-full"></span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <!-- Chat Area -->
  <div class="bg-base-100 flex flex-1 flex-col">
    {#if selectedUser}
      <div class="border-base-200 flex items-center gap-2 border-b p-4">
        <h3 class="flex-1 text-lg font-semibold">{selectedUser.username || selectedUser.userId}</h3>
        <span class="bg-success h-3 w-3 rounded-full"></span>
      </div>
      <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {#if userMessages.length === 0}
          <div class="text-base-content/60 flex min-h-[120px] items-center justify-center">
            <p>Нет сообщений. Начните диалог!</p>
          </div>
        {:else}
          {#each userMessages as message}
            <div class={`chat ${message.senderId === 'currentUser' ? 'chat-end' : 'chat-start'}`}>
              <div
                class={`chat-bubble ${message.senderId === 'currentUser' ? 'bg-primary text-primary-content' : 'bg-base-200'}`}
              >
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
          placeholder="Введите сообщение..."
          class="input input-bordered flex-1"
          bind:value={messageInput}
          onkeydown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button type="submit" class="btn btn-primary">Отправить</button>
      </form>
    {:else}
      <div class="text-base-content/70 flex flex-1 items-center justify-center">
        <p>Выберите пользователя для переписки</p>
      </div>
    {/if}
  </div>
</div>
