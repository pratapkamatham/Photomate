export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  encryptedSecret: string;
}
 
export interface Theme {
  primaryColor: string;
  font: string;
  layout: string;
}
 
export interface Photographer {
  id?: string;
  ownerUid: string;
  slug: string;
  studioName: string;
  bio?: string;
  phone?: string;
  email?: string;
  theme: Theme;
  subscriptionPlan: 'monthly' | 'yearly' | 'lifetime' | 'none';
  isActive: boolean;
  cloudinary?: CloudinaryConfig;
  createdAt: Date;
}
