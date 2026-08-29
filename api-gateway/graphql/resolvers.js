const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {redisClient}=require('../config/redis');
const {DateTimeResolver}=require('graphql-scalars');
const {getAllCampaigns,createCampaign,updateCampaign,deleteCampaign}=require('../models/campaignModel');
const {createUser,getUserByEmail,getUserById}=require('../models/userModel');

const setAuthCookie=(res,user)=>{
    const token=jwt.sign(
        {userId: user.id,role: user.role},
        process.env.JWT_SECRET,
        {expiresIn:'1d'}
    );

    res.cookie('token',token,{
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        sameSite:process.env.NODE_ENV==='production'?'none':'lax',
        maxAge: 1000*60*60*24
    });
};

const requireAuth=(context)=>{
    if(!context.user){
        throw new Error('Unauthorized: You must be logged in to perform this action.');
    }
};

const resolvers={
    DateTime: DateTimeResolver,

    Query:{
        getAllCampaigns:async()=> await getAllCampaigns(),
        me:async(_,__,context)=>{
            if(!context.user) return null;
            return await getUserById(context.user.userId);
        },
        getCampaignPrediction: async(_,{platform,budget,status},context)=>{
            requireAuth(context);

            const cacheKey=`prediction:${platform}:${budget}:${status}`;

            try{
                const cachedData=await redisClient.get(cacheKey);

                if(cachedData){
                    console.log('Serving prediction from Redis Cache!');
                    return JSON.parse(cachedData);
                }

                console.log('Cache miss. Asking Python AI Engine...');

                const mlUrl=`${process.env.ML_ENGINE_URL}/predict`;

                const response=await fetch(mlUrl,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({platform,budget,status})
                });

                if(!response.ok){
                    throw new Error('ML Engine is currently unreachable');
                }

                const predictionData=await response.json();

                await redisClient.setEx(cacheKey,3600,JSON.stringify(predictionData))

                return predictionData;
            }
            catch(error){
                console.error('Microservice communication error:',error);
                throw new Error('Failed to fetch AI prediction.');
            }
        }
    },

    Mutation:{
        createCampaign: async(_,{name,platform,budget},context)=> {
            requireAuth(context);
            return await createCampaign(name,platform,budget);
        },

        updateCampaign:async(_,{id,name,platform,budget,status},context)=>{
            requireAuth(context);
            return await updateCampaign(id,name,platform,budget,status);
        },

        deleteCampaign: async(_,{id},context)=> {
            requireAuth(context);
            return await deleteCampaign(id);
        },

        register:async(_,{email,password},context)=>{
            const newUser=await createUser(email,password);
            setAuthCookie(context.res,newUser);
            return newUser;
        },

        login: async(_,{email,password},context)=>{
            const user=await getUserByEmail(email);
            if(!user || !(await bcrypt.compare(password,user.password_hash))) throw new Error('Invalid email or password');

            setAuthCookie(context.res,user);
            return user;
        },

        logout: async(_,__,context)=>{
            context.res.clearCookie('token');
            return true;
        }
    }
};

module.exports={resolvers};