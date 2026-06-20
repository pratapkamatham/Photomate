import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotographerService } from '../../../core/services/photographer.service';
import { AuthService } from '../../../core/services/auth.service'; // 🚀 Import your AuthService
import { Theme } from '../../../core/models/photographer.model';

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
    private photographerService: PhotographerService,
    private authService: AuthService // 🚀 Inject your AuthService here
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
    this.settingsForm.get('studioName')?.valueChanges
      .subscribe(value => {
        if (!this.profileExists) {
          const slug = value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
          this.settingsForm.patchValue(
            { slug },
            { emitEvent: false }
          );
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
            bio:        profile.bio   || '',
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

    const defaultTheme: Theme = {
      primaryColor:    '#111111',
      accentColor:     '#c9a96e',
      backgroundColor: '#111111',
      textColor:       '#ffffff',
      font:            'Poppins',
      layout:          'luxury-dark',
      heroStyle:       'centered'
    };

    // 🚀 Get the active user's UID to pass security rule evaluations
 // 🚀 New code: Get the user object first, then extract the uid safely
const currentUser = this.authService.getCurrentUser();
const currentUid = currentUser ? currentUser.uid : null;

if (!currentUid) {
  this.errorMessage = 'User session not found. Please log in again.';
  this.isSaving = false;
  return;
}

    const data = {
      ownerUid: currentUid, // 🚀 CRITICAL ADDITION: Satisfies your Firestore Security Rules!
      studioName: this.settingsForm.value.studioName,
      slug:       this.settingsForm.value.slug,
      bio:        this.settingsForm.value.bio,
      phone:      this.settingsForm.value.phone,
      email:      this.settingsForm.value.email,
      theme:      defaultTheme
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
      error: (err) => {
        console.error('Firestore rule execution rejected payload:', err); // Log for verification
        this.isSaving = false;
        this.errorMessage = 'Failed to save. Please try again.';
      }
    });
  }

}