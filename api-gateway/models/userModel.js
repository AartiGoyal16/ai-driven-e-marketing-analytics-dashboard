const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (email, plainTextPassword, role = 'user') => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(plainTextPassword, salt);

        // Check if this is the very first user in the database, if so make them admin
        const countRes = await pool.query('SELECT COUNT(*) FROM users');
        const assignedRole = parseInt(countRes.rows[0].count, 10) === 0 ? 'admin' : (role || 'user');

        const query = `
            INSERT INTO users (email, password_hash, role)
            VALUES ($1, $2, $3)
            RETURNING id, email, role, created_at;
        `;

        const result = await pool.query(query, [email.toLowerCase().trim(), passwordHash, assignedRole]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user. Email might already exist.');
    }
};

const getUserByEmail = async (email) => {
    try {
        const query = `SELECT * FROM users WHERE LOWER(email) = LOWER($1);`;
        const result = await pool.query(query, [email.trim()]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
    }
};

const getUserById = async (id) => {
    try {
        const query = `SELECT id, email, role, created_at FROM users WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new Error('Failed to fetch user');
    }
};

const getAllUsers = async () => {
    try {
        const query = `SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw new Error('Failed to fetch user accounts.');
    }
};

const updateUserRole = async (id, newRole) => {
    try {
        if (!['admin', 'user'].includes(newRole)) {
            throw new Error("Invalid role specified. Must be 'admin' or 'user'.");
        }
        const query = `
            UPDATE users SET role = $1
            WHERE id = $2
            RETURNING id, email, role, created_at;
        `;
        const result = await pool.query(query, [newRole, id]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating user role:', error);
        throw new Error('Failed to update user role.');
    }
};

const updateUserPassword = async (email, plainTextPassword) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(plainTextPassword, salt);

        const query = `
            UPDATE users SET password_hash = $1
            WHERE LOWER(email) = LOWER($2)
            RETURNING id, email, role, created_at;
        `;

        const result = await pool.query(query, [passwordHash, email.trim()]);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error updating user password:', error);
        throw new Error('Failed to update password');
    }
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    getAllUsers,
    updateUserRole,
    updateUserPassword
};