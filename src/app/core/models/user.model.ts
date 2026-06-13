export type UserRole = 'super-admin' | 'photographer'|'affiliate';
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}