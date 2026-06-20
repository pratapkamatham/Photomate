import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

type AdminStat = {
  collectionName: string;
  label: string;
  value: string;
  icon: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoading = true;
  errorMessage = '';

  stats: AdminStat[] = [
    { collectionName: 'photographers', label: 'Total Photographers', value: '0', icon: 'P' },
    { collectionName: 'subscriptions', label: 'Active Subscriptions', value: '0', icon: 'S' },
    { collectionName: 'galleries', label: 'Total Galleries', value: '0', icon: 'G' },
    { collectionName: 'mediaAssets', label: 'Total Media Assets', value: '0', icon: 'M' }
  ];

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    const results = await Promise.allSettled(
      this.stats.map(stat => getDocs(collection(this.firestore, stat.collectionName)))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.stats[index].value = result.value.size.toString();
      } else {
        console.error(`Error loading ${this.stats[index].collectionName}:`, result.reason);
      }
    });

    if (results.some(result => result.status === 'rejected')) {
      this.errorMessage = 'Some admin numbers could not be loaded. Check Firestore rules or indexes, then try refresh.';
    }

    this.isLoading = false;
  }
}
