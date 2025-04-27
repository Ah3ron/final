import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User or null if not found
 */
export async function getUserById(id) {
  const [user] = await db
    .select({
      id: table.user.id,
      username: table.user.username,
      fullName: table.user.fullName,
      email: table.user.email,
      departmentId: table.user.departmentId,
      roleId: table.user.roleId,
      position: table.user.position,
      isActive: table.user.isActive,
      lastActive: table.user.lastActive,
      profilePicture: table.user.profilePicture
    })
    .from(table.user)
    .where(eq(table.user.id, id));

  return user || null;
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User or null if not found
 */
export async function getUserByUsername(username) {
  const [user] = await db
    .select({
      id: table.user.id,
      username: table.user.username,
      fullName: table.user.fullName,
      email: table.user.email,
      departmentId: table.user.departmentId,
      roleId: table.user.roleId,
      position: table.user.position,
      isActive: table.user.isActive,
      lastActive: table.user.lastActive,
      profilePicture: table.user.profilePicture
    })
    .from(table.user)
    .where(eq(table.user.username, username));

  return user || null;
}

/**
 * Get users by department ID
 * @param {number} departmentId - Department ID
 * @returns {Promise<Array>} List of users
 */
export async function getUsersByDepartmentId(departmentId) {
  return db
    .select({
      id: table.user.id,
      username: table.user.username,
      fullName: table.user.fullName,
      email: table.user.email,
      position: table.user.position,
      isActive: table.user.isActive,
      lastActive: table.user.lastActive,
      profilePicture: table.user.profilePicture
    })
    .from(table.user)
    .where(eq(table.user.departmentId, departmentId));
}

/**
 * Search users
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of users
 */
export async function searchUsers(query) {
  const searchPattern = `%${query}%`;

  return db
    .select({
      id: table.user.id,
      username: table.user.username,
      fullName: table.user.fullName,
      email: table.user.email,
      departmentId: table.user.departmentId,
      position: table.user.position,
      profilePicture: table.user.profilePicture
    })
    .from(table.user)
    .where(
      or(
        like(table.user.username, searchPattern),
        like(table.user.fullName, searchPattern),
        like(table.user.email, searchPattern)
      )
    )
    .limit(20);
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  const userId = generateUserId();
  const passwordHash = await hash(userData.password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });

  const user = {
    id: userId,
    username: userData.username,
    passwordHash,
    fullName: userData.fullName,
    email: userData.email,
    departmentId: userData.departmentId,
    roleId: userData.roleId,
    position: userData.position,
    isActive: true
  };

  const [result] = await db.insert(table.user).values(user).returning({
    id: table.user.id,
    username: table.user.username,
    fullName: table.user.fullName,
    email: table.user.email,
    departmentId: table.user.departmentId,
    roleId: table.user.roleId,
    position: table.user.position
  });

  return result;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object|null>} Updated user or null if not found
 */
export async function updateUserProfile(userId, userData) {
  const [user] = await db
    .update(table.user)
    .set(userData)
    .where(eq(table.user.id, userId))
    .returning({
      id: table.user.id,
      username: table.user.username,
      fullName: table.user.fullName,
      email: table.user.email,
      departmentId: table.user.departmentId,
      roleId: table.user.roleId,
      position: table.user.position,
      profilePicture: table.user.profilePicture
    });

  return user || null;
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} True if password was changed, false otherwise
 */
export async function changeUserPassword(userId, newPassword) {
  const passwordHash = await hash(newPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });

  const [user] = await db
    .update(table.user)
    .set({ passwordHash })
    .where(eq(table.user.id, userId))
    .returning({ id: table.user.id });

  return !!user;
}

/**
 * Get all departments
 * @returns {Promise<Array>} List of departments
 */
export async function getAllDepartments() {
  return db.select().from(table.department);
}

/**
 * Get department by ID
 * @param {number} id - Department ID
 * @returns {Promise<Object|null>} Department or null if not found
 */
export async function getDepartmentById(id) {
  const [department] = await db.select().from(table.department).where(eq(table.department.id, id));

  return department || null;
}

/**
 * Create a new department
 * @param {string} name - Department name
 * @param {string} description - Department description
 * @returns {Promise<Object>} Created department
 */
export async function createDepartment(name, description) {
  const [department] = await db.insert(table.department).values({ name, description }).returning();

  return department;
}

/**
 * Get all roles
 * @returns {Promise<Array>} List of roles
 */
export async function getAllRoles() {
  return db.select().from(table.role);
}

/**
 * Get role by ID
 * @param {number} id - Role ID
 * @returns {Promise<Object|null>} Role or null if not found
 */
export async function getRoleById(id) {
  const [role] = await db.select().from(table.role).where(eq(table.role.id, id));

  return role || null;
}

/**
 * Create a new role
 * @param {string} name - Role name
 * @param {Object} permissions - Role permissions
 * @returns {Promise<Object>} Created role
 */
export async function createRole(name, permissions) {
  const [role] = await db.insert(table.role).values({ name, permissions }).returning();

  return role;
}

/**
 * Generate a unique user ID
 * @returns {string} User ID
 */
function generateUserId() {
  // ID with 120 bits of entropy, or about the same as UUID v4.
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  const id = encodeBase32LowerCase(bytes);
  return id;
}
