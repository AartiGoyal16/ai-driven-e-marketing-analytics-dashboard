const {Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({
    connectionString: process.env.DATABASE_URL,
});

const connectDB=async()=>{
    try{
        await pool.query('SELECT 1');
        console.log('PostgreSQL connected successfully');
    }
    catch(err){
        console.error('Database connection error:',err);
    }
};

module.exports={pool, connectDB}