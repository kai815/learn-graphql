import { GraphQLScalarType } from 'graphql';
import fetch from 'node-fetch';

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

const requestGithubToken = async (credentials:string) => {
  const response = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'post',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
        Accept:'application/json'
      }
  })
  return await response.json()
}

const requestGithubUserAccount = async (token:any) =>{
  const response = await fetch(`https://api.github.com/user`,{
    headers:{
      "Authorization":`token ${token}`
    }
  })
  return await response.json()
}

const authorizeWithGithub = async (credentials:any) => {
  // @ts-ignore
  const { access_token } = await requestGithubToken(credentials)
  console.log({access_token})
  if(access_token){
    const githubUser = await requestGithubUserAccount(access_token)
    console.log({githubUser})
    // @ts-ignore
    return { ...githubUser, access_token }
  }
  return {"message":"notuser"}
}

export const resolvers = {
  Query: {
    // @ts-ignore
    me:(parent, args, contextValue) => contextValue.currentUser
    ,
    // @ts-ignore
    totalPhotos: (parent, args, contextValue) => {
      const count = contextValue.db.collection('photos').estimatedDocumentCount()
      return count
    },
    // @ts-ignore
    allPhotos: (parent, args, contextValue) => {
      const photos = contextValue.db.collection('photos').find().toArray()
      return photos
    },
    // @ts-ignore
    totalUsers: (parent, args, contextValue) => {
      const count = contextValue.db.collection('users').estimatedDocumentCount()
      return count
    },
    // @ts-ignore
    allUsers: (parent, args, contextValue) => {
      const users = contextValue.db.collection('users').find().toArray()
      return users
    },
  },
  // postPhotoミューテーションと対応するリゾルバ
  Mutation: {
    //TODOこの辺のやつはts-ignoreは後で直す
    // @ts-ignore
    async postPhoto(parent, args, contextValue) {
      const { currentUser, db } = contextValue
      // ユーザーがいなければエラー
      if(!currentUser){
      throw new Error(`only an authorized user can post a photo`)
      }
      const newPhoto = {
        ...args.input,
        userID:currentUser.githubLogin,
        created: new Date()
      }
      // 3. 新しいphotoを追加して、データベースが生成したIDを取得する
      const { insertedIds } = await db.collection(`photos`).insert(newPhoto)
      newPhoto.id = insertedIds[0]
      return newPhoto
    },
    // @ts-ignore
    async githubAuth(parent, args, contextValue) {
      const githubUser = await authorizeWithGithub({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code:args.code
      })

      if (githubUser.message) {
        throw new Error(githubUser.message)
      }

      const latestUserInfo = {
        name:githubUser.name,
        githubLogin: githubUser.login,
        githubToken: githubUser.access_token,
        avatar: githubUser.avatar_url
      }

      const dbres = await contextValue.db
        .collection('users')
        .replaceOne({ githubLogin: githubUser.login }, latestUserInfo, { upsert: true })
      return { user:latestUserInfo,token: githubUser.access_token }
    },
    // @ts-ignore
    addFakeUsers: async (root, {count}, {db}) => {
      const randomUserApi = `https://randomuser.me/api/?results=${count}`
      const { results } = await fetch(randomUserApi).then(res => res.json())
      // @ts-ignore
      const users = results.map((r) => ({
        githubLogin: r.login.username,
        name: `${r.name.first} ${r.name.last}`,
        avatar: r.picture.thumbnail,
        githubToken: r.login.sha1
      }))
      await db.collection(`users`).insert(users)
      return users
    },
    // @ts-ignore
    fakeUserAuth: async (parent, { githubLogin }, { db }) => {
      const user = await db.collection(`users`).findOne({ githubLogin })
      if (!user) {
        // @ts-ignore
        throw new Error(`Cannot find user with githubLogin ${githubLogin}`)
      }
      return {
        token: user.githubToken,
        user
      }
    }
  },
  Photo: {
    // @ts-ignore
    id: parent => parent.id || parent._id,
    // @ts-ignore
    url: parent => `http://yoursite.com/img/${parent._id}.jpg`,
    // @ts-ignore
    postedBy: (parent,args,{db}) => {
      return db.collection(`users`).findOne({ githubLogin: parent.userID })
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
