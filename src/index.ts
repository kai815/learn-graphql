import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
//TODO .jsなくてもよくしたい
import { typeDefs } from './schema.js';
import { resolvers } from './resolver.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv'
dotenv.config()
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@learngraphql.doxh4xt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);



// サーバーのインスタンスを作成
// その際、typeDefs（スキーマ）とリゾルバを引数に取る
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// Webサーバーを起動
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({
    db: await client.db('learn_graphql')
  })
});
console.log(`GraphQL Service running on ${url}`)
