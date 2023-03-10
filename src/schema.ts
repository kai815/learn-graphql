//TODO .grapqlファイルにしたかったが上手くimportできなかったので後で
export const typeDefs = `
  enum PhotoCategory {
    SELFIE
    PORTRAIT
    ACTION
    LANDSCAPE
    GRAPHIC
  }
  type User {
  githubLogin: ID!
  name: String
  avatar: String
  postedPhotos: [Photo!]!
  inPhotos: [Photo!]!
  }
  type AuthPayload {
    token: String!
    user: User!
  }
  scalar DateTime
  type Photo {
    id: ID!
    url: String!
    name: String!
    description: String
    category: PhotoCategory!
    postedBy: User!
    taggedUsers: [User!]!
    created: DateTime!
  }
  type Query {
    me: User
    totalPhotos: Int!
    allPhotos(after:DateTime): [Photo!]!
    totalUsers: Int!
    allUsers: [User!]!
  }
  input PostPhotoInput {
    name: String!
    category: PhotoCategory=PORTRAIT
    description: String
  }
  type Mutation {
    postPhoto(input:PostPhotoInput!): Photo!
    githubAuth(code: String!): AuthPayload!
    addFakeUsers(count: Int = 1): [User!]!
    fakeUserAuth(githubLogin: ID!): AuthPayload!
  }
`
