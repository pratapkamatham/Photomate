export interface PortfolioSection {
  id?: string;
  photographerId: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  heroImage?: string;
  heroImages?: string[];
  isPrivate: boolean;
  sortOrder?: number;
  createdAt: Date;
}

export interface PortfolioAsset {
  id?: string;
  sectionId: string;
  photographerId: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  sortOrder?: number;
  createdAt: Date;
}

