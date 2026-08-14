const express=require("express");
const {ApolloServer}=require("@apollo/server");
const {expressMiddleware}=require("@as-integrations/express5");
const cors=require("cors");
const dotenv=require("dotenv");

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

    app.use(cors());
    app.use(express.json());
    app.use('/graphql',expressMiddleware(server));

    const PORT=process.env.PORT||4000;

    app.listen(PORT,()=>{
        console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });
};

startServer();