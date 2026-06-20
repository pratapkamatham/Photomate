import { Component, OnInit } from '@angular/core';
import { Firestore, collection, doc, getDocs, updateDoc } from '@angular/fire/firestore';
import { Photographer } from 'src/app/core/models/photographer.model';

@Component({
  selector: 'app-photographers-list',
  templateUrl: './photographers-list.component.html',
  styleUrls: ['./photographers-list.component.css']
})
export class PhotographersListComponent implements OnInit {
  photographers: Photographer[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadPhotographers();
  }

  async loadPhotographers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const snapshot = await getDocs(collection(this.firestore, 'photographers'));
      this.photographers = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Photographer));
    } catch (err) {
      console.error('Error loading photographers:', err);
      this.errorMessage = 'Photographers could not be loaded. Check admin permissions and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async toggleActive(photographer: Photographer): Promise<void> {
    if (!photographer.id) {
      return;
    }

    const nextValue = !photographer.isActive;
    const previousValue = photographer.isActive;
    photographer.isActive = nextValue;

    try {
      const ref = doc(this.firestore, `photographers/${photographer.id}`);
      await updateDoc(ref, { isActive: nextValue });
    } catch (err) {
      photographer.isActive = previousValue;
      console.error('Error updating photographer status:', err);
      this.errorMessage = 'Could not update this photographer. Try again.';
    }
  }
}
