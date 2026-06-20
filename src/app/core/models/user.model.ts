export type UserRole = 'super-admin' | 'photographer' | 'affiliate';

export interface User {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  createdAt?: any;
}