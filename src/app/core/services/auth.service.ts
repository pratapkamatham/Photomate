import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  currentUser$: Observable<FirebaseUser | null>;
 
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    this.currentUser$ = authState(this.auth);
  }
 // -----------------------------------------------
  // REGISTER - creates user + trial subscription
  // -----------------------------------------------
  register(email: string, password: string, role: UserRole = 'photographer') {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(credential => {
        const uid = credential.user.uid;

        const userRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(userRef, {
          uid,
          email,
          role,
          createdAt: serverTimestamp()
        })).pipe(
          switchMap(() => {
            if (role === 'photographer') {
              const now = new Date();
              const trialEndsAt = new Date(now);
              trialEndsAt.setDate(trialEndsAt.getDate() + 7);

              const subRef = doc(this.firestore, `subscriptions/${uid}`);
              return from(setDoc(subRef, {
                photographerId: uid,
                plan:           'trial',
                status:         'active',
                startDate:      serverTimestamp(),
                trialEndsAt:    Timestamp.fromDate(trialEndsAt),
                amount:         0,
                createdAt:      serverTimestamp()
              }));
            }
            return of(null);
          })
        );
      })
    );
  }

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout() {
    return from(signOut(this.auth)).pipe(
      switchMap(() => {
        this.router.navigate(['/auth/login']);
        return of(null);
      })
    );
  }

  forgotPassword(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  getUserRole(uid: string): Observable<UserRole | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      switchMap(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          return of(data.role);
        }
        return of(null);
      })
    );
  }

  getCurrentUserRole(): Observable<UserRole | null> {
    return this.currentUser$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) return of(null);
        return this.getUserRole(firebaseUser.uid);
      })
    );
  }

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }
 
  // isLoggedIn() REMOVED
  // Reason: auth.currentUser is null briefly after
  // page refresh even if user is authenticated.
  // Always use currentUser$ Observable in guards.
 
}
 