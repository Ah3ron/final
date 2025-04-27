<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import {
    initWebSocket,
    disconnect,
    connected,
    notifications,
    onlineUsers
  } from '$lib/websocket-client';
  import { page } from '$app/stores';

  let { data, children } = $props();
  let unsubscribe;

  $effect(() => {
    if (data.user && $page.url.pathname !== '/login') {
      // В реальном приложении здесь мы бы инициализировали соединение WebSocket
      // Пока что, для демонстрации, установим состояние "подключён" в true
      // TODO
      connected.set(true);

      onlineUsers.set([
        { userId: 'user1', username: 'Джон Доу' },
        { userId: 'user2', username: 'Джейн Смит' }
      ]);

      notifications.set([
        {
          id: 'notif1',
          type: 'сообщение',
          title: 'Новое сообщение',
          content: 'У вас новое сообщение от Джейн Смит',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: 'notif2',
          type: 'операция',
          title: 'Обновление операции',
          content: 'Заявка на одобрение кредита была утверждена',
          timestamp: new Date().toISOString(),
          read: true
        }
      ]);
    }
  });

  onDestroy(() => {
    disconnect();
  });
</script>

<main>
  {@render children()}
</main>

<style>
</style>
