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
  serverTimestamp
} from '@angular/fire/firestore';
import { from, Observable, switchMap, of } from 'rxjs';
import { MediaAsset } from '../models/media-asset.model';
 
@Injectable({
  providedIn: 'root'
})
export class MediaAssetService {
 
  constructor(private firestore: Firestore) {}
 
  // -----------------------------------------------
  // SAVE media asset metadata after upload
  // -----------------------------------------------
  saveAsset(asset: Partial<MediaAsset>): Observable<string> {
    const ref = collection(this.firestore, 'mediaAssets');
    return from(addDoc(ref, {
      ...asset,
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }
 
  // -----------------------------------------------
  // GET all assets for a gallery
  // -----------------------------------------------
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
 
  // -----------------------------------------------
  // DELETE asset metadata
  // -----------------------------------------------
  deleteAsset(id: string): Observable<void> {
    const ref = doc(this.firestore, `mediaAssets/${id}`);
    return from(deleteDoc(ref));
  }
 
}