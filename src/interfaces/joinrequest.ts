import { Document } from "./types";

export interface JoinRequest extends Document {
  discord_id: string;
  created_at: Date;
  access_token: string;
}
