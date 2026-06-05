import { Component, OnInit } from '@angular/core';
import { Firestore, getDocs, collection } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
 
  stats = [
    { label: 'Total Photographers', value: '0', icon: '◫' },
    { label: 'Active Subscriptions', value: '0', icon: '★' },
    { label: 'Total Galleries',      value: '0', icon: '⬡' },
    { label: 'Total Media Assets',   value: '0', icon: '⇗' },
  ];
 
  constructor(private firestore: Firestore) {}
 
  ngOnInit(): void {
    this.loadStats();
  }
 
  async loadStats(): Promise<void> {
    try {
      const photographers = await getDocs(
        collection(this.firestore, 'photographers')
      );
      const galleries = await getDocs(
        collection(this.firestore, 'galleries')
      );
      const subscriptions = await getDocs(
        collection(this.firestore, 'subscriptions')
      );
 
      this.stats[0].value = photographers.size.toString();
      this.stats[1].value = subscriptions.size.toString();
      this.stats[2].value = galleries.size.toString();
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }
 
}