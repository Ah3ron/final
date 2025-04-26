<script>
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { initWebSocket, disconnect, connected, notifications, onlineUsers } from '$lib/websocket-client';
	import { page } from '$app/stores';

	let { data, children } = $props();
	let unsubscribe;

	// Initialize WebSocket connection when user is authenticated
	// For now, we'll simulate the WebSocket connection for demonstration purposes
	$effect(() => {
		if (data.user && $page.url.pathname !== '/login') {
			// In a real application, we would initialize the WebSocket connection here
			// For now, we'll just set the connected state to true for demonstration
			connected.set(true);
			
			// Simulate some online users
			onlineUsers.set([
				{ userId: 'user1', username: 'John Doe' },
				{ userId: 'user2', username: 'Jane Smith' }
			]);
			
			// Simulate some notifications
			notifications.set([
				{
					id: 'notif1',
					type: 'message',
					title: 'New Message',
					content: 'You have a new message from Jane Smith',
					timestamp: new Date().toISOString(),
					read: false
				},
				{
					id: 'notif2',
					type: 'operation',
					title: 'Operation Update',
					content: 'Loan approval request has been approved',
					timestamp: new Date().toISOString(),
					read: true
				}
			]);
		}
	});

	// Disconnect WebSocket when component is destroyed
	onDestroy(() => {
		disconnect();
	});
</script>

{#if $connected}
	<div class="websocket-status connected">WebSocket Connected</div>
{:else}
	<div class="websocket-status disconnected">WebSocket Disconnected</div>
{/if}

{#if $notifications.length > 0}
	<div class="notification-badge">
		{$notifications.filter(n => !n.read).length}
	</div>
{/if}

<main>
	{@render children()}
</main>

<style>
	.websocket-status {
		position: fixed;
		top: 0;
		right: 0;
		padding: 5px 10px;
		font-size: 12px;
		z-index: 1000;
	}
	
	.connected {
		background-color: #4CAF50;
		color: white;
	}
	
	.disconnected {
		background-color: #F44336;
		color: white;
	}
	
	.notification-badge {
		position: fixed;
		top: 10px;
		right: 10px;
		background-color: #FF5722;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		z-index: 1001;
	}
	
	main {
		padding: 20px;
	}
</style>
