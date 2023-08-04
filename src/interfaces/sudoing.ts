import "realm-web/types/realm/services";
type Document = Realm.Services.MongoDB.Document;

export interface Sudoing extends Document {
  discord_id: string;
  executed_at: Date;
}