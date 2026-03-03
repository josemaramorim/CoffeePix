export interface AppUser {
  id: string;
  email: string;
  role: string | { name: string };
  company_id?: string | null;
  client_id?: string | null;
  password_hash?: string;
}
