const express=require("express");
const {ApolloServer}=require("@apollo/server");
const {expressMiddleware}=require("@as-integrations/express5");
const cors=require("cors");
const dotenv=require("dotenv");
const cookieParser=require("cookie-parser");
const jwt=require('jsonwebtoken');

dotenv.config();

const {connectDB}=require('./config/db');
const {connectRedis}=require('./config/redis');
const {typeDefs}=require('./graphql/typeDefs');
const {resolvers}=require('./graphql/resolvers');

async function startServer() {
    const app=express();

    await connectDB();
    await connectRedis();

    const server=new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    app.use(cors({
        origin:['http://localhost:3000','https://studio.apollographql.com'],
        credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());
    app.use('/graphql',expressMiddleware(server,{
        context: async({req,res})=>{
            let user=null;
            const token=req.cookies.token;

            if(token){
                try{
                    user=jwt.verify(token,process.env.JWT_SECRET);
                }
                catch(err){
                    console.log("Invalid or expired token");
                }
            }

            return {req,res,user};
        }
    }));

    const PORT=process.env.PORT||4000;

    app.listen(PORT,()=>{
        console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });
};

startServer();