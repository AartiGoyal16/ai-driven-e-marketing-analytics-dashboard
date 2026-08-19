const typeDefs=`
    scalar DateTime

    type Campaign{
        id:ID!
        name:String!
        platform:String!
        budget:Float!
        status:String!
        created_at:DateTime!
    }

    type User {
        id:ID!
        email: String!
        role: String!
    }

    type Query{
        getAllCampaigns: [Campaign!]!
        me: User
    }

    type Mutation{
        createCampaign(name:String!, platform:String!, budget:Float!):Campaign!
        updateCampaign(id:ID!, name:String, platform:String, budget:Float, status:String):Campaign
        deleteCampaign(id:ID!):Boolean!

        register(email: String!, password: String!):User!
        login(email:String!,password:String!):User!
        logout: Boolean!
    }
`;

module.exports={typeDefs};