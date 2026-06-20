export interface MediaAsset {
  id?: string;
  galleryId: string;
  photographerId: string;
  sectionId?: string;
  sectionTitle?: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format?: string;
  sortOrder?: number;
  createdAt: Date;
}
