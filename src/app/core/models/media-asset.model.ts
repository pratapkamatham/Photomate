export interface MediaAsset {
  id?: string;
  galleryId: string;
  photographerId: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format?: string;
  createdAt: Date;
}