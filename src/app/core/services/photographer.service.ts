import { Injectable } from '@angular/core';
import {
  Firestore,collection,doc,setDoc,getDoc,updateDoc,query,where,getDocs, serverTimestamp} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable, switchMap, of, Subscription } from 'rxjs';
import { Photographer } from '../models/photographer.model';
@Injectable({
  providedIn: 'root'
})
export class PhotographerService {

  constructor(private firestore:Firestore,private auth:Auth) { }
  //create photographer profile
  createProfile(data:Partial<Photographer>):Observable<void>{
    const uid = this.auth.currentUser?.uid;
    if(!uid) throw new Error('Not authenticated');
    const ref=doc(this.firestore,'photographers/${uid}');
    return from(setDoc(ref,{
      ...data,
      ownerUid:uid,
      isActive:true,
      SubscriptionPlan:'none',
      createdAt:serverTimestamp()
    }));
  }
  getMyProfile():Observable<Photographer|null>{
    const uid=this.auth.currentUser?.uid;
    if(!uid) return of(null);
    const ref=doc(this.firestore,`photographers/${uid}`);
    return from(getDoc(ref)).pipe(
      switchMap(snapshot=>{
        if(snapshot.exists()){
          return of({id:snapshot.id,...snapshot.data()} as Photographer);
        }
        return of(null);
      })
    );
  }
    getBySlug(slug: string): Observable<Photographer | null> {
    const ref = collection(this.firestore, 'photographers');
    const q = query(ref, where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          return of({ id: docSnap.id, ...docSnap.data() } as Photographer);
        }
        return of(null);
      })
    );
  }
  updateProfile(data: Partial<Photographer>): Observable<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
 
    const ref = doc(this.firestore, `photographers/${uid}`);
    return from(updateDoc(ref, { ...data }));
  }
    saveCloudinaryConfig(
    cloudName: string,
    apiKey: string,
    encryptedSecret: string
  ): Observable<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
 
    const ref = doc(this.firestore, `photographers/${uid}`);
    return from(updateDoc(ref, {
      cloudinary: {
        cloudName,
        apiKey,
        encryptedSecret
      }
    }));
  }
    isSlugAvailable(slug: string): Observable<boolean> {
    const ref = collection(this.firestore, 'photographers');
    const q = query(ref, where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      switchMap(snapshot => of(snapshot.empty))
    );
  }
 
}
