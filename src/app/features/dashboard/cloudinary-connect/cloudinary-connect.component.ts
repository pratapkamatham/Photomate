import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotographerService } from '../../../core/services/photographer.service';
import { Photographer } from '../../../core/models/photographer.model';
import { Functions, httpsCallable } from '@angular/fire/functions';
 
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
    private functions: Functions,
    private photographerService: PhotographerService
  ) {}

  ngOnInit(): void {
    this.cloudinaryForm = this.fb.group({
      cloudName: ['', Validators.required],
      apiKey:    ['', Validators.required],
      apiSecret: ['', Validators.required]
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
          this.cloudinaryForm.patchValue({
            cloudName: profile.cloudinary.cloudName,
            apiKey:    profile.cloudinary.apiKey
          });
          // Never pre-fill apiSecret
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

    // FIX 3: Call Firebase Function to save secret securely
    // Never save to Firestore directly from Angular
    const saveFn = httpsCallable(
      this.functions,
      'saveCloudinaryConfig'
    );

    saveFn({ cloudName, apiKey, apiSecret }).then(() => {
      this.isSaving = false;
      this.isConnected = true;
      this.existingCloudName = cloudName;
      this.successMessage = 'Cloudinary connected securely!';
      this.cloudinaryForm.patchValue({ apiSecret: '' });
    }).catch((err) => {
      this.isSaving = false;
      this.errorMessage = err.message || 'Failed to save. Please try again.';
    });
  }

}
