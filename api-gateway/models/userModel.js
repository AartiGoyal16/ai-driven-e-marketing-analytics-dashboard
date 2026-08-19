const {pool}=require('../config/db');
const bcrypt=require('bcryptjs');

const createUser=async(email,plainTextPassword)=>{
    try{
        const salt=await bcrypt.genSalt(10);
        const passwordHash=await bcrypt.hash(plainTextPassword,salt);

        const query=`
            INSERT INTO users (email,password_hash)
            VALUES ($1,$2)
            RETURNING id, email, role, created_at;
        `;

        const result=await pool.query(query,[email,passwordHash]);
        return result.rows[0];
    }
    catch(error){
        console.error('Error creating user:',error);
        throw new Error('Failed to create user. Email might already exist.');
    }
};

const getUserByEmail=async(email)=>{
    try{
        const query=`SELECT * FROM users WHERE email=$1;`;
        const result=await pool.query(query,[email]);
        return result.rows[0];
    }
    catch(error){
        console.error('Error fetching user:',error);
        throw new Error('Failed to fetch user');
    }
};

const getUserById=async(id)=>{
    try{
        const query=`SELECT id,email,role FROM users WHERE id=$1;`;
        const result=await pool.query(query,[id]);
        return result.rows[0];
    }
    catch(error){
        console.error('Error fetching user by ID:',error);
        throw new Error('Failed to fetch user');
    }
};

module.exports={createUser,getUserByEmail, getUserById};