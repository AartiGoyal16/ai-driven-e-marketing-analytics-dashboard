const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node resetPassword.js <email> <newPassword>');
  process.exit(1);
}

async function reset() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, role;',
      [passwordHash, email]
    );

    if (result.rowCount === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      console.log(`Successfully updated password for ${email}!`);
      console.table(result.rows);
    }
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await pool.end();
  }
}

reset();
