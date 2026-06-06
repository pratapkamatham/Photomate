import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GalleryService } from 'src/app/core/services/gallery.service';

@Component({
  selector: 'app-gallery-create',
  templateUrl: './gallery-create.component.html',
  styleUrls: ['./gallery-create.component.css']
})
export class GalleryCreateComponent implements OnInit {
 
  galleryForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
 
  constructor(
    private fb: FormBuilder,
    private galleryService: GalleryService,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.galleryForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(3)]],
      slug:        ['', [Validators.required,
                         Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
      description: [''],
      isPrivate:   [false]
    });
 
    // Auto-generate slug from title
    this.galleryForm.get('title')?.valueChanges.subscribe(value => {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      this.galleryForm.patchValue({ slug }, { emitEvent: false });
    });
  }
 
  get title()       { return this.galleryForm.get('title'); }
  get slug()        { return this.galleryForm.get('slug'); }
  get description() { return this.galleryForm.get('description'); }
 
  onSubmit(): void {
    if (this.galleryForm.invalid) {
      this.galleryForm.markAllAsTouched();
      return;
    }
 
    this.isLoading = true;
    this.errorMessage = '';
 
    this.galleryService.createGallery({
      title:       this.galleryForm.value.title,
      slug:        this.galleryForm.value.slug,
      description: this.galleryForm.value.description,
      isPrivate:   this.galleryForm.value.isPrivate,
      createdAt:   new Date()
    }).subscribe({
      next: (galleryId) => {
        this.isLoading = false;
        this.router.navigate([`/dashboard/galleries/${galleryId}/upload`]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create gallery. Please try again.';
        console.error(err);
      }
    });
  }
 
  cancel(): void {
    this.router.navigate(['/dashboard/galleries']);
  }
 
}
