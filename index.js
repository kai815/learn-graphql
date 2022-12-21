const { ApolloServer } = require(`apollo-server`)

const typeDefs = `
  type Query {
    totalPhotos: Int!
  }
  type Mutation {
    postPhoto(name: String! description: String): Boolean!
  }
`

// 写真を格納するための配列を定義する
var photos = []

const resolvers = {
  Query: {
    totalPhotos: () => photos.length
  },
  // postPhotoミューテーションと対応するリゾルバ
  Mutation: {
    postPhoto(parent, args) {
        photos.push(args)
        return true
    }
  }
}

// サーバーのインスタンスを作成
// その際、typeDefs（スキーマ）とリゾルバを引数に取る
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// Webサーバーを起動
server
  .listen()
  .then(({url}) => console.log(`GraphQL Service running on ${url}`))
