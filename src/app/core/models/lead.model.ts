export interface Lead {
  id?: string;
  photographerId: string;
  photographerSlug: string;
  galleryId?: string;
  gallerySlug?: string;
  source: 'portfolio' | 'gallery';
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: Date;
}
