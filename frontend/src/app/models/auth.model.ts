
export interface ILoginCredentials {
    username: string;
    password?: string; 

}
  
export interface IRegisterPayload {
    username: string;
    email: string;
    password?: string; 
    password2?: string; 
    first_name?: string; 
    last_name?: string; 
}