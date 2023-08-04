import { Document } from "./types";

export interface Sudoing extends Document {
  discord_id: string;
  executed_at: Date;
}