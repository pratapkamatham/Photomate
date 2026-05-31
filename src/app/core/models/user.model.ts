export type UserRole = 'super-admin' | 'photographer';
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}