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
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  currentUser$: Observable<FirebaseUser | null>;
  // FIX: gallery-upload కాంపోనెంట్ అడుగుతున్న 'user$' ను ఇక్కడ మ్యాప్ చేసాం
  user$: Observable<FirebaseUser | null>;
 
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    this.currentUser$ = authState(this.auth);
    this.user$ = this.currentUser$; // రెండు ఒకే స్ట్రీమ్‌ను షేర్ చేసుకుంటాయి
  }
 
  // -----------------------------------------------
  // REGISTER
  // -----------------------------------------------
  register(
    email: string,
    password: string,
    role: UserRole = 'photographer'
  ) {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(credential => {
        const uid = credential.user.uid;
        const userRef = doc(this.firestore, `users/${uid}`);
        return from(
          setDoc(userRef, {
            uid,
            email,
            role,
            createdAt: serverTimestamp()
          })
        );
      })
    );
  }
 
  // -----------------------------------------------
  // LOGIN
  // -----------------------------------------------
  login(email: string, password: string) {
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
    );
  }
 
  // -----------------------------------------------
  // LOGOUT
  // -----------------------------------------------
  logout() {
    return from(signOut(this.auth)).pipe(
      switchMap(() => {
        this.router.navigate(['/auth/login']);
        return of(null);
      })
    );
  }

  // FORGOT PASSWORD
  forgotPassword(email: string) {
    return from(
      sendPasswordResetEmail(this.auth, email)
    );
  }

  // -----------------------------------------------
  // GET USER ROLE FROM FIRESTORE
  // Strongly typed - returns UserRole not string
  // -----------------------------------------------
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
 
  // -----------------------------------------------
  // GET CURRENT USER ROLE HELPER
  // Uses currentUser$ Observable - safe after refresh
  // Guards will use this constantly
  // -----------------------------------------------
  getCurrentUserRole(): Observable<UserRole | null> {
    return this.currentUser$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) {
          return of(null);
        }
        return this.getUserRole(firebaseUser.uid);
      })
    );
  }

  // -----------------------------------------------
  // GET CURRENT FIREBASE USER (snapshot)
  // -----------------------------------------------
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }
 
  // isLoggedIn() REMOVED
  // Reason: auth.currentUser is null briefly after
  // page refresh even if user is authenticated.
  // Always use currentUser$ Observable in guards.
}