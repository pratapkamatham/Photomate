export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  encryptedSecret: string;
}
 
export interface Theme {
  primaryColor:    string;
  accentColor:     string;
  backgroundColor: string;
  textColor:       string;
  font:            string;
  layout:          'luxury-dark' | 'minimal-light' | 'bold-dark';
  heroStyle:       'centered' | 'split' | 'fullscreen';
}
 
export interface Photographer {
 id?:              string;
  ownerUid:         string;
  slug:             string;
  studioName:       string;
  bio?:             string;
  phone?:           string;
  email?:           string;
  logoUrl?:         string;
  coverImageUrl?:   string;
  theme:            Theme;
  subscriptionPlan: 'trial' | 'monthly' | 'yearly' | 'lifetime' | 'none';
  isActive:         boolean;
  cloudinary?:      CloudinaryConfig;
  createdAt?:       any;
}
