import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from '@angular/fire/firestore';
import { from, Observable, switchMap, of } from 'rxjs';
import { MediaAsset } from '../models/media-asset.model';

@Injectable({
  providedIn: 'root'
})
export class MediaAssetService {

  constructor(private firestore: Firestore) {}

  saveAsset(asset: Partial<MediaAsset>): Observable<string> {
    const ref = collection(this.firestore, 'mediaAssets');
    return from(addDoc(ref, {
      ...asset,
      sectionId: asset.sectionId || 'highlights',
      sectionTitle: asset.sectionTitle || 'Highlights',
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }

  getGalleryAssets(galleryId: string): Observable<MediaAsset[]> {
    const ref = collection(this.firestore, 'mediaAssets');
    const q = query(
      ref,
      where('galleryId', '==', galleryId),
      orderBy('createdAt', 'asc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const assets = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as MediaAsset));
        return of(assets);
      })
    );
  }

  getGallerySectionAssets(galleryId: string, sectionId: string): Observable<MediaAsset[]> {
    const ref = collection(this.firestore, 'mediaAssets');
    const q = query(
      ref,
      where('galleryId', '==', galleryId),
      where('sectionId', '==', sectionId),
      orderBy('createdAt', 'asc')
    );
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const assets = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as MediaAsset));
        return of(assets);
      })
    );
  }

  getPhotographerAssets(photographerId: string): Observable<MediaAsset[]> {
    const ref = collection(this.firestore, 'mediaAssets');
    const q = query(
      ref,
      where('photographerId', '==', photographerId),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const assets = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as MediaAsset));
        return of(assets);
      })
    );
  }

  deleteAsset(id: string): Observable<void> {
    const ref = doc(this.firestore, `mediaAssets/${id}`);
    return from(deleteDoc(ref));
  }
}
