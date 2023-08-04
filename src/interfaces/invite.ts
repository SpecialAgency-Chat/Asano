import { Document } from "./types";

export interface Invite extends Document {
  issuer_id: string;
  code: string;
  expires: number;
  created_at: Date;
}
