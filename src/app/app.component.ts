import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private auth:Auth,private firestore:Firestore){}
  ngOnInit(): void {
  // this.seedSuperAdmin();
  }
  // private async seedSuperAdmin(){
  //   const adminEmail ='';
  //   const adminPassword='';
  //   const seedFlagRef=doc(this.firestore,'system/initial_seed');
  //   try{
  //     // 1. Check a metadata document to see if we already seeded the system
  //     const seedCheck = await getDoc(seedFlagRef);
  //     if (seedCheck.exists()) return; // System already seeded, skip!

  //     console.log('Seeding system default Super Admin...');
  //    // 2. Create the Auth Credential
  //    const credential = await createUserWithEmailAndPassword(this.auth,adminEmail,adminPassword);
  //    //3.Document the custom role payload in Firestore
  //    await setDoc(doc(this.firestore,`users/${credential.user.uid}`),{
  //     uid:credential.user.uid,
  //     email:adminEmail,
  //     role:'super-admin',
  //     createdAt:serverTimestamp()
  //    });
  //    //4. Mark seed as complete so this never triggers again
  //    await setDoc(seedFlagRef,{seeded:true,seedAt:serverTimestamp()});
  //    console.log('Super Admin Successfully seeded!');
  //   }
  //   catch(err:any){
  //     console.log('seed check completed or account already present..')
  //   };    
  // }
  title = 'Photomate';
}
