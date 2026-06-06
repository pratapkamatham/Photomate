import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PhotographerService } from 'src/app/core/services/photographer.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
 
  settingsForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  profileExists = false;
 
  constructor(
    private fb: FormBuilder,
    private photographerService: PhotographerService
  ) {}
 
  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      studioName: ['', [Validators.required, Validators.minLength(2)]],
      slug:       ['', [Validators.required,
                        Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
      bio:        [''],
      phone:      [''],
      email:      ['', [Validators.email]]
    });
 
    // Auto generate slug from studio name
    this.settingsForm.get('studioName')?.valueChanges.subscribe(value => {
      if (!this.profileExists) {
        const slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        this.settingsForm.patchValue({ slug }, { emitEvent: false });
      }
    });
 
    this.loadProfile();
  }
 
  get studioName() { return this.settingsForm.get('studioName'); }
  get slug()       { return this.settingsForm.get('slug'); }
  get email()      { return this.settingsForm.get('email'); }
 
  loadProfile(): void {
    this.isLoading = true;
    this.photographerService.getMyProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        if (profile) {
          this.profileExists = true;
          this.settingsForm.patchValue({
            studioName: profile.studioName,
            slug:       profile.slug,
            bio:        profile.bio || '',
            phone:      profile.phone || '',
            email:      profile.email || ''
          });
        }
      },
      error: () => { this.isLoading = false; }
    });
  }
 
  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }
 
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
 
    const data = {
      studioName: this.settingsForm.value.studioName,
      slug:       this.settingsForm.value.slug,
      bio:        this.settingsForm.value.bio,
      phone:      this.settingsForm.value.phone,
      email:      this.settingsForm.value.email,
      theme: {
        primaryColor: '#000000',
        font: 'Poppins',
        layout: 'luxury-dark'
      }
    };
 
    const operation$ = this.profileExists
      ? this.photographerService.updateProfile(data)
      : this.photographerService.createProfile(data);
 
    operation$.subscribe({
      next: () => {
        this.isSaving = false;
        this.profileExists = true;
        this.successMessage = 'Settings saved successfully!';
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save settings. Please try again.';
      }
    });
  }
 
}
