import { IUser } from "./user.model";

export interface ITokenResponse {
  access: string;
  refresh: string;
  user: IUser;
}