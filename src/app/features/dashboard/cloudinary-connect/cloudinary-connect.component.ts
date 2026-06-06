import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotographerService } from '../../../core/services/photographer.service';
import { Photographer } from '../../../core/models/photographer.model';
 
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
 
  constructor(
    private fb: FormBuilder,
    private photographerService: PhotographerService
  ) {}
 
  ngOnInit(): void {
    this.cloudinaryForm = this.fb.group({
      cloudName: ['', [Validators.required]],
      apiKey:    ['', [Validators.required]],
      apiSecret: ['', [Validators.required]]
    });
    this.loadExistingConfig();
  }
 
  get cloudName() { return this.cloudinaryForm.get('cloudName'); }
  get apiKey()    { return this.cloudinaryForm.get('apiKey'); }
  get apiSecret() { return this.cloudinaryForm.get('apiSecret'); }
 
  loadExistingConfig(): void {
    this.isLoading = true;
    this.photographerService.getMyProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        if (profile?.cloudinary?.cloudName) {
          this.isConnected = true;
          this.existingCloudName = profile.cloudinary.cloudName;
          // Pre-fill cloudName only, never show secret
          this.cloudinaryForm.patchValue({
            cloudName: profile.cloudinary.cloudName,
            apiKey: profile.cloudinary.apiKey
          });
        }
      },
      error: () => { this.isLoading = false; }
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
 
    const { cloudName, apiKey, apiSecret } = this.cloudinaryForm.value;
 
    // NOTE: In production, apiSecret should be encrypted
    // via Firebase Function before storing.
    // For MVP we store it as-is and handle encryption
    // in the upload signature function.
    this.photographerService.saveCloudinaryConfig(
      cloudName,
      apiKey,
      apiSecret
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.isConnected = true;
        this.existingCloudName = cloudName;
        this.successMessage = 'Cloudinary connected successfully!';
        // Clear secret field after save
        this.cloudinaryForm.patchValue({ apiSecret: '' });
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save. Please try again.';
        console.error(err);
      }
    });
  }
 
}