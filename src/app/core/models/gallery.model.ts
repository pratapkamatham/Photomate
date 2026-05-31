export interface Gallery {
  id?: string;
  photographerId: string;
  slug: string;
  title: string;
  coverImage?: string;
  isPrivate: boolean;
  description?: string;
  eventDate?: Date;
  createdAt: Date;
}