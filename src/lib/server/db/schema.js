import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const department = pgTable('department', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description')
});

export const role = pgTable('role', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	permissions: jsonb('permissions')
});

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	fullName: text('full_name'),
	email: text('email').unique(),
	departmentId: integer('department_id').references(() => department.id),
	roleId: integer('role_id').references(() => role.id),
	position: text('position'),
	isActive: boolean('is_active').default(true),
	lastActive: timestamp('last_active', { withTimezone: true, mode: 'date' }),
	profilePicture: text('profile_picture'),
	metadata: jsonb('metadata')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const message = pgTable('message', {
	id: serial('id').primaryKey(),
	senderId: text('sender_id').notNull().references(() => user.id),
	recipientId: text('recipient_id').references(() => user.id),
	departmentId: integer('department_id').references(() => department.id),
	content: text('content').notNull(),
	isRead: boolean('is_read').default(false),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	metadata: jsonb('metadata')
});

export const bankingOperation = pgTable('banking_operation', {
	id: serial('id').primaryKey(),
	type: text('type').notNull(),
	requesterId: text('requester_id').notNull().references(() => user.id),
	approverId: text('approver_id').references(() => user.id),
	status: text('status').notNull().default('pending'),
	data: jsonb('data'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
});

export const notification = pgTable('notification', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	isRead: boolean('is_read').default(false),
	type: text('type').notNull(),
	relatedEntityType: text('related_entity_type'),
	relatedEntityId: text('related_entity_id'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});
