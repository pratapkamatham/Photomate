import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PortfolioSectionService } from 'src/app/core/services/portfolio-section.service';

@Component({
  selector: 'app-portfolio-section-create',
  templateUrl: './portfolio-section-create.component.html',
  styleUrls: ['./portfolio-section-create.component.css']
})
export class PortfolioSectionCreateComponent implements OnInit {
  sectionForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  presets = [
    'Wedding Shots',
    'Pre-Wedding Outdoor Shoots',
    'Birthday Shoots',
    'Kids Shoots',
    'New Born Baby Shoots',
    'Beach Shoots'
  ];

  constructor(
    private fb: FormBuilder,
    private sectionService: PortfolioSectionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sectionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      slug: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
      description: [''],
      isPrivate: [false]
    });

    this.sectionForm.get('title')?.valueChanges.subscribe(value => {
      this.sectionForm.patchValue({ slug: this.slugify(value || '') }, { emitEvent: false });
    });
  }

  get title() { return this.sectionForm.get('title'); }
  get slug() { return this.sectionForm.get('slug'); }

  applyPreset(title: string): void {
    this.sectionForm.patchValue({ title });
  }

  onSubmit(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.sectionService.createSection({
      title: this.sectionForm.value.title,
      slug: this.sectionForm.value.slug,
      description: this.sectionForm.value.description,
      isPrivate: this.sectionForm.value.isPrivate,
      createdAt: new Date()
    }).subscribe({
      next: id => {
        this.isLoading = false;
        this.router.navigate([`/dashboard/portfolio-sections/${id}/upload`]);
      },
      error: err => {
        console.error('Create portfolio section failed:', err);
        this.errorMessage = 'Failed to create portfolio section.';
        this.isLoading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/portfolio-sections']);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
