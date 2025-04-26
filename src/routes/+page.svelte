<script>
	import { enhance } from '$app/forms';
	import { onlineUsers, messages, departmentMessages, operations, notifications } from '$lib/websocket-client';
	import MessagesTab from '$lib/components/MessagesTab.svelte';
	import DepartmentsTab from '$lib/components/DepartmentsTab.svelte';
	import OperationsTab from '$lib/components/OperationsTab.svelte';

	let { data } = $props();
	let activeTab = $state('dashboard');
	
	// Tabs: dashboard, messages, departments, operations
	const tabs = [
		{ id: 'dashboard', label: 'Dashboard' },
		{ id: 'messages', label: 'Messages' },
		{ id: 'departments', label: 'Departments' },
		{ id: 'operations', label: 'Operations' }
	];
	
	function setActiveTab(tabId) {
		activeTab = tabId;
	}
</script>

<div class="bank-app">
	<header>
		<h1>Bank Employee Portal</h1>
		<div class="user-info">
			<span>Welcome, {data.user.username}!</span>
			<form method="post" action="?/logout" use:enhance>
				<button class="logout-btn">Sign out</button>
			</form>
		</div>
	</header>

	<nav class="tabs">
		{#each tabs as tab}
			<button 
				class="tab-btn {activeTab === tab.id ? 'active' : ''}" 
				onclick={() => setActiveTab(tab.id)}
			>
				{tab.label}
				{#if tab.id === 'messages' && $messages.filter(m => !m.isRead).length > 0}
					<span class="badge">{$messages.filter(m => !m.isRead).length}</span>
				{/if}
				{#if tab.id === 'operations' && $operations.filter(o => o.status === 'pending').length > 0}
					<span class="badge">{$operations.filter(o => o.status === 'pending').length}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<main class="content">
		{#if activeTab === 'dashboard'}
			<div class="dashboard">
				<div class="card">
					<h2>User Information</h2>
					<p><strong>Username:</strong> {data.user.username}</p>
					<p><strong>User ID:</strong> {data.user.id}</p>
					<p><strong>Role:</strong> {data.user.roleId ? `Role ${data.user.roleId}` : 'Not assigned'}</p>
					<p><strong>Department:</strong> {data.user.departmentId ? `Department ${data.user.departmentId}` : 'Not assigned'}</p>
				</div>
				
				<div class="card">
					<h2>Online Users ({$onlineUsers.length})</h2>
					{#if $onlineUsers.length === 0}
						<p>No users online</p>
					{:else}
						<ul class="user-list">
							{#each $onlineUsers as user}
								<li class="user-item">
									<span class="user-status online"></span>
									<span>{user.username || user.userId}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				
				<div class="card">
					<h2>Recent Notifications</h2>
					{#if $notifications.length === 0}
						<p>No notifications</p>
					{:else}
						<ul class="notification-list">
							{#each $notifications.slice(0, 5) as notification}
								<li class="notification-item {notification.read ? 'read' : ''}">
									<div class="notification-title">{notification.title}</div>
									<div class="notification-content">{notification.content}</div>
									<div class="notification-time">
										{new Date(notification.timestamp).toLocaleString()}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'messages'}
			<div class="messages">
				<MessagesTab />
			</div>
		{:else if activeTab === 'departments'}
			<div class="departments">
				<DepartmentsTab />
			</div>
		{:else if activeTab === 'operations'}
			<div class="operations">
				<OperationsTab />
			</div>
		{/if}
	</main>
</div>

<style>
	.bank-app {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 20px;
		background-color: #1976D2;
		color: white;
	}
	
	header h1 {
		margin: 0;
		font-size: 24px;
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 20px;
	}
	
	.logout-btn {
		background-color: transparent;
		border: 1px solid white;
		color: white;
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 4px;
	}
	
	.logout-btn:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}
	
	.tabs {
		display: flex;
		background-color: #f5f5f5;
		border-bottom: 1px solid #ddd;
	}
	
	.tab-btn {
		padding: 10px 20px;
		border: none;
		background-color: transparent;
		cursor: pointer;
		position: relative;
	}
	
	.tab-btn.active {
		background-color: white;
		border-bottom: 2px solid #1976D2;
		font-weight: bold;
	}
	
	.badge {
		position: absolute;
		top: 5px;
		right: 5px;
		background-color: #FF5722;
		color: white;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
	}
	
	.content {
		flex: 1;
		padding: 20px;
		background-color: #f9f9f9;
	}
	
	.dashboard {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
	}
	
	.card {
		background-color: white;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 20px;
	}
	
	.card h2 {
		margin-top: 0;
		border-bottom: 1px solid #eee;
		padding-bottom: 10px;
		font-size: 18px;
	}
	
	.user-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.user-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #eee;
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
	
	.notification-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.notification-item {
		padding: 10px;
		border-bottom: 1px solid #eee;
		background-color: #f0f8ff;
	}
	
	.notification-item.read {
		background-color: transparent;
	}
	
	.notification-title {
		font-weight: bold;
		margin-bottom: 5px;
	}
	
	.notification-time {
		font-size: 12px;
		color: #777;
		margin-top: 5px;
	}
</style>
