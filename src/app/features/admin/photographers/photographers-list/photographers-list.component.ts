import { Component, OnInit } from '@angular/core';
import { Firestore, getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { Photographer } from 'src/app/core/models/photographer.model';

@Component({
  selector: 'app-photographers-list',
  templateUrl: './photographers-list.component.html',
  styleUrls: ['./photographers-list.component.css']
})
export class PhotographersListComponent implements OnInit {
 
  photographers: Photographer[] = [];
  isLoading = true;
 
  constructor(private firestore: Firestore) {}
 
  ngOnInit(): void {
    this.loadPhotographers();
  }
 
  async loadPhotographers(): Promise<void> {
    try {
      const snapshot = await getDocs(
        collection(this.firestore, 'photographers')
      );
      this.photographers = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Photographer));
    } catch (err) {
      console.error('Error loading photographers:', err);
    } finally {
      this.isLoading = false;
    }
  }
 
  async toggleActive(photographer: Photographer): Promise<void> {
    if (!photographer.id) return;
    const ref = doc(this.firestore, `photographers/${photographer.id}`);
    await updateDoc(ref, { isActive: !photographer.isActive });
    photographer.isActive = !photographer.isActive;
  }
 
}
 
