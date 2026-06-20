import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable, switchMap, of } from 'rxjs';
import { Lead } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  createLead(data: Partial<Lead>): Observable<string> {
    const ref = collection(this.firestore, 'leads');
    return from(addDoc(ref, {
      ...data,
      status: 'new',
      createdAt: serverTimestamp()
    })).pipe(
      switchMap(docRef => of(docRef.id))
    );
  }

  getMyLeads(): Observable<Lead[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of([]);

    const ref = collection(this.firestore, 'leads');
    const q = query(
      ref,
      where('photographerId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const leads = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Lead));
        return of(leads);
      })
    );
  }
}
