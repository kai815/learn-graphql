import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
//TODO .jsなくてもよくしたい
import { typeDefs } from './schema.js';
import { resolvers } from './resolver.js';


// サーバーのインスタンスを作成
// その際、typeDefs（スキーマ）とリゾルバを引数に取る
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// Webサーバーを起動
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});
console.log(`GraphQL Service running on ${url}`)
