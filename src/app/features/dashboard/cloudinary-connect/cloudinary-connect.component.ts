import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotographerService } from '../../../core/services/photographer.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-cloudinary-connect',
  templateUrl: './cloudinary-connect.component.html',
  styleUrls: ['./cloudinary-connect.component.css']
})
export class CloudinaryConnectComponent implements OnInit {

  cloudinaryForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  isConnected = false;
  existingCloudName = '';
  saveDebugMessage = '';

  constructor(
    private fb: FormBuilder,
    private photographerService: PhotographerService
  ) {}

  ngOnInit(): void {
    this.cloudinaryForm = this.fb.group({
      cloudName: ['', Validators.required],
      apiKey: ['', Validators.required],
      apiSecret: ['', Validators.required]
    });

    this.loadExistingConfig();
  }

  get cloudName() {
    return this.cloudinaryForm.get('cloudName');
  }

  get apiKey() {
    return this.cloudinaryForm.get('apiKey');
  }

  get apiSecret() {
    return this.cloudinaryForm.get('apiSecret');
  }

  loadExistingConfig(): void {
    this.isLoading = true;

    this.photographerService.getMyProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;

        if (profile?.cloudinary?.cloudName) {
          this.isConnected = true;
          this.existingCloudName = profile.cloudinary.cloudName;

          this.cloudinaryForm.patchValue({
            cloudName: profile.cloudinary.cloudName,
            apiKey: profile.cloudinary.apiKey
          });
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.cloudinaryForm.invalid) {
      this.cloudinaryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.saveDebugMessage = 'Saving Cloudinary credentials...';

    const cloudName = this.cloudinaryForm.value.cloudName.trim();
    const apiKey = this.cloudinaryForm.value.apiKey.trim();
    const apiSecret = this.cloudinaryForm.value.apiSecret.trim();
    const maskedApiKey = apiKey.replace(/\d(?=\d{4})/g, '*');

    console.groupCollapsed('[Cloudinary Config] form submit');
    console.table({
      cloudName,
      apiKey: maskedApiKey,
      apiSecretLength: apiSecret.length
    });
    console.groupEnd();

    this.photographerService.saveCloudinaryConfig({
      cloudName,
      apiKey,
      apiSecret
    }).pipe(
      timeout(30000)
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.isConnected = true;
        this.existingCloudName = cloudName;
        this.successMessage = 'Cloudinary connected securely!';
        this.saveDebugMessage = `Saved Cloudinary config for ${cloudName}.`;
        this.cloudinaryForm.patchValue({ apiSecret: '' });
        this.apiSecret?.markAsPristine();
        this.apiSecret?.markAsUntouched();
      },
      error: (err) => {
        console.error('[Cloudinary Config] save failed in component', err);
        this.isSaving = false;
        this.saveDebugMessage = '';
        this.errorMessage =
          err?.name === 'TimeoutError'
            ? 'Saving timed out after 30 seconds. Check Firebase Function logs and try again.'
            : err?.message || 'Failed to save. Please try again.';
      }
    });
  }
}
