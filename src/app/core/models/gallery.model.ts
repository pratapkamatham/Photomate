export interface GallerySection {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  coverImage?: string;
}

export interface GalleryShareSettings {
  allowDownloads: boolean;
  showBranding: boolean;
  leadCaptureEnabled: boolean;
  ctaLabel?: string;
}

export interface Gallery {
  id?: string;
  photographerId: string;
  slug: string;
  title: string;
  coverImage?: string;
  heroImage?: string;
  heroImages?: string[];
  isPrivate: boolean;
  description?: string;
  eventDate?: Date;
  sections?: GallerySection[];
  defaultSectionId?: string;
  shareSettings?: GalleryShareSettings;
  createdAt: Date;
}

