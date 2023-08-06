import { Document } from "./types";

export interface User extends Document {
  discord_id: string;
  created_at: Date;
  updated_at: Date;
  access_token: string;
  refresh_token: string;
}
