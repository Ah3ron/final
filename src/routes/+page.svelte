<script>
  import { enhance } from '$app/forms';
  import {
    onlineUsers,
    messages,
    departmentMessages,
    operations,
    notifications
  } from '$lib/websocket-client';
  import MessagesTab from '$lib/components/MessagesTab.svelte';
  import DepartmentsTab from '$lib/components/DepartmentsTab.svelte';
  import OperationsTab from '$lib/components/OperationsTab.svelte';

  let { data } = $props();
  let activeTab = $state('dashboard');

  // Табы: дашборд, сообщения, отделы, операции
  const tabs = [
    { id: 'dashboard', label: 'Панель' },
    { id: 'messages', label: 'Сообщения' },
    { id: 'departments', label: 'Отделы' },
    { id: 'operations', label: 'Операции' }
  ];

  function setActiveTab(tabId) {
    activeTab = tabId;
  }
</script>

<div class="bg-base-200 flex min-h-screen flex-col">
  <header
    class="bg-primary text-primary-content flex items-center justify-between px-6 py-4 shadow"
  >
    <h1 class="text-2xl font-bold">Портал сотрудника банка</h1>
    <div class="flex items-center gap-6">
      <span>Добро пожаловать, <b class="font-medium">{data.user.username}</b>!</span>
      <form method="post" action="?/logout" use:enhance>
        <button class="btn btn-sm btn-ghost border-primary-content hover:bg-primary-focus border"
          >Выйти</button
        >
      </form>
    </div>
  </header>

  <nav class="tabs tabs-boxed mx-4 mt-2">
    {#each tabs as tab}
      <button
        class="tab relative font-medium transition-all {activeTab === tab.id
          ? 'tab-active text-primary'
          : ''}"
        onclick={() => setActiveTab(tab.id)}
      >
        {tab.label}
        {#if tab.id === 'messages' && $messages.filter((m) => !m.isRead).length > 0}
          <span class="badge badge-warning badge-sm absolute top-0 right-[-0.5rem] animate-bounce">
            {$messages.filter((m) => !m.isRead).length}
          </span>
        {/if}
        {#if tab.id === 'operations' && $operations.filter((o) => o.status === 'pending').length > 0}
          <span class="badge badge-error badge-sm absolute top-0 right-[-0.5rem] animate-bounce">
            {$operations.filter((o) => o.status === 'pending').length}
          </span>
        {/if}
      </button>
    {/each}
  </nav>

  <main class="flex-1 px-4 py-6">
    {#if activeTab === 'dashboard'}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Информация о пользователе -->
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title mb-2">Информация о пользователе</h2>
            <p><span class="font-semibold">Имя пользователя:</span> {data.user.username}</p>
            <p><span class="font-semibold">ID пользователя:</span> {data.user.id}</p>
            <p>
              <span class="font-semibold">Роль:</span>
              {data.user.roleId ? `Роль ${data.user.roleId}` : 'Не назначена'}
            </p>
            <p>
              <span class="font-semibold">Отдел:</span>
              {data.user.departmentId ? `Отдел ${data.user.departmentId}` : 'Не назначен'}
            </p>
          </div>
        </div>

        <!-- Пользователи онлайн -->
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title mb-2">Пользователи онлайн ({$onlineUsers.length})</h2>
            {#if $onlineUsers.length === 0}
              <p class="text-base-content/70">Нет пользователей онлайн</p>
            {:else}
              <ul class="divide-base-300 divide-y">
                {#each $onlineUsers as user}
                  <li class="flex items-center gap-2 py-2">
                    <span class="badge badge-success badge-xs"></span>
                    <span class="font-medium">{user.username || user.userId}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <!-- Недавние уведомления -->
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title mb-2">Недавние уведомления</h2>
            {#if $notifications.length === 0}
              <p class="text-base-content/70">Нет уведомлений</p>
            {:else}
              <ul class="space-y-2">
                {#each $notifications.slice(0, 5) as notification}
                  <li
                    class="flex flex-col gap-1 rounded-lg border p-3 {notification.read
                      ? 'bg-base-100'
                      : 'bg-info/10 border-info'}"
                  >
                    <div class="flex items-center justify-between">
                      <div class="font-semibold">
                        {notification.title}
                      </div>
                      {#if !notification.read}
                        <span class="badge badge-info">Новое</span>
                      {/if}
                    </div>
                    <div class="text-base-content/80">{notification.content}</div>
                    <div class="text-base-content/60 text-xs">
                      {new Date(notification.timestamp).toLocaleString('ru-RU')}
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    {:else if activeTab === 'messages'}
      <div class="mt-6">
        <MessagesTab />
      </div>
    {:else if activeTab === 'departments'}
      <div class="mt-6">
        <DepartmentsTab />
      </div>
    {:else if activeTab === 'operations'}
      <div class="mt-6">
        <OperationsTab />
      </div>
    {/if}
  </main>
</div>
