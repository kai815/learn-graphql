import { GraphQLScalarType } from 'graphql';

// 1. ユニークIDをインクリメントするための変数
let _id = 0

// サンプル
let users = [
  { "githubLogin": "mHattrup", "name": "Mike Hattrup" },
  { "githubLogin": "gPlake", "name": "Glen Plake" },
  { "githubLogin": "sSchmidt", "name": "Scot Schmidt" }
]

let photos = [
  {
    "id": "1",
    "name": "Dropping the Heart Chute",
    "description": "The heart chute is one of my favorite chutes",
    "category": "ACTION",
    "githubUser": "gPlake",
    "created": "3-28-1977"
  },
  {
    "id": "2",
    "name": "Enjoying the sunshine",
    "category": "SELFIE",
    "githubUser": "sSchmidt",
    "created": "1-2-1985"
  },
  {
    "id": "3",
    "name": "Gunbarrel 25",
    "description": "25 laps on gunbarrel today",
    "category": "LANDSCAPE",
    "githubUser": "sSchmidt",
    "created": "2018-04-15T19:09:57.308Z"
  }
]

let tags = [
  { "photoID": "1", "userID": "gPlake" },
  { "photoID": "2", "userID": "sSchmidt" },
  { "photoID": "2", "userID": "mHattrup" },
  { "photoID": "2", "userID": "gPlake" }
]

export const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: () => photos
  },
  // postPhotoミューテーションと対応するリゾルバ
  Mutation: {
    //TODOこの辺のやつはts-ignoreは後で直す
    // @ts-ignore
    postPhoto(parent, args) {
      // 2.新しい写真を作成し、idを生成する
      const newPhoto = {
        id: _id++,
        ...args.input,
        created: new Date()
      }
      photos.push(newPhoto)
      return newPhoto
    }
  },
  Photo: {
    // @ts-ignore
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
    // @ts-ignore
    postedBy: parent => {
      return users.find(u => u.githubLogin === parent.githubUser)
    },
    // @ts-ignore
    taggedUsers: parent => tags.filter(
      tag => tag.photoID === parent.id
    ).map(
      tag => tag.userID
    ).map(
      userID => users.find(u => u.githubLogin === userID)
    )
  },
  User: {
    // @ts-ignore
    postedPhotos: parent => {
      return photos.filter(p => p.githubUser === parent.githubLogin)
    },
    // @ts-ignore
    inPhotos: parent => tags.filter(
      tag => tag.userID === parent.id
    ).map(
      tag => tag.photoID
    ).map(
      photoId => photos.find(
        photo => photo.id === photoId
      )
    )
  },
  DateTime:new GraphQLScalarType({
    name:'DateTime',
    description:'A Valid Date Time Value',
    // @ts-ignore
    parseValue:value => new Date(value),
    // @ts-ignore
    server:value => new Date(value).toISOString(),
    // @ts-ignore
    parseLiteral: ast => ast.value
  })
}