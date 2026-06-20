import { Component, OnInit } from '@angular/core';
import { Lead } from 'src/app/core/models/lead.model';
import { LeadService } from 'src/app/core/services/lead.service';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {

  leads: Lead[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private leadService: LeadService) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.leadService.getMyLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load leads:', err);
        this.errorMessage = err?.message?.includes('index')
          ? 'Database index is still deploying. Try again after a minute.'
          : 'Could not load leads right now.';
        this.isLoading = false;
      }
    });
  }

  contactHref(lead: Lead): string {
    if (lead.phone) return `tel:${lead.phone}`;
    if (lead.email) return `mailto:${lead.email}`;
    return '';
  }

  sourceLabel(lead: Lead): string {
    return lead.source === 'gallery' && lead.gallerySlug
      ? `Album: ${lead.gallerySlug}`
      : 'Portfolio';
  }
}
