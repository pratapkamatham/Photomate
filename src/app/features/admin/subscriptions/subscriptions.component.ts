import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Subscription } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css']
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: Subscription[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  async loadSubscriptions(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const snapshot = await getDocs(collection(this.firestore, 'subscriptions'));
      this.subscriptions = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Subscription));
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      this.errorMessage = 'Subscriptions could not be loaded. Check admin permissions and try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
