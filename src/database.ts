import * as Realm from "realm-web";
let App: Realm.App;

export async function getClient(env: Record<string, string>) {
  if (!env.MONGODB_REALM_APPID || !env.MONGODB_API_KEY) throw new Error("Missing MongoDB Realm env variables");
  App = App || new Realm.App(env.MONGODB_REALM_APPID);
  const credentials = Realm.Credentials.apiKey(env.MONGODB_API_KEY);
  // Attempt to authenticate
  const user = await App.logIn(credentials);
  const client = user.mongoClient("mongodb-atlas");
  return client;
}