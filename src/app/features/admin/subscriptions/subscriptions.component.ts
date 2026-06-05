import { Component, OnInit } from '@angular/core';
import { Firestore, getDocs, collection } from 'firebase/firestore';
import{Subscription} from '../../../core/models/subscription.model';


@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css']
})
export class SubscriptionsComponent implements OnInit {
 
  subscriptions: Subscription[] = [];
  isLoading = true;
 
  constructor(private firestore: Firestore) {}
 
  ngOnInit(): void {
    this.loadSubscriptions();
  }
 
  async loadSubscriptions(): Promise<void> {
    try {
      const snapshot = await getDocs(
        collection(this.firestore, 'subscriptions')
      );
      this.subscriptions = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Subscription));
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      this.isLoading = false;
    }
  }
 
}