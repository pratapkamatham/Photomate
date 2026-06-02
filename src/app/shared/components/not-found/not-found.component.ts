import { Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
constructor(private router:Router)
{}
goHome(){
  this.router.navigate(['/login']);
}
}
