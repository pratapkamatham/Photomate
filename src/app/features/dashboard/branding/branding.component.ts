import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotographerService } from '../../../core/services/photographer.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Theme } from '../../../core/models/photographer.model';

@Component({
  selector: 'app-branding',
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.css']
})
export class BrandingComponent implements OnInit {

  brandingForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  previewTheme: Theme | null = null;
  selectedPreset = 'luxury-dark';

  fonts = [
    'Poppins',
    'Inter',
    'Montserrat',
    'Playfair Display',
    'Lato'
  ];

  heroStyles = [
    { value: 'centered', label: 'Centered' },
    { value: 'split', label: 'Split' },
    { value: 'fullscreen', label: 'Fullscreen' }
  ];

  constructor(
    private fb: FormBuilder,
    private photographerService: PhotographerService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.brandingForm = this.fb.group({
      primaryColor:     ['#111111', Validators.required],
      accentColor:      ['#c9a96e', Validators.required],
      backgroundColor:  ['#111111', Validators.required],
      textColor:        ['#ffffff', Validators.required],
      font:             ['Poppins', Validators.required],
      layout:           ['luxury-dark', Validators.required],
      heroStyle:        ['centered', Validators.required]
    });

    this.loadExistingTheme();

    // Live preview
    this.brandingForm.valueChanges.subscribe(values => {
      this.previewTheme = values as Theme;
    });
  }

  loadExistingTheme(): void {
    this.isLoading = true;
    this.photographerService.getMyProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        if (profile?.theme) {
          this.brandingForm.patchValue(profile.theme);
          this.selectedPreset = profile.theme.layout;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyPreset(presetValue: string): void {
    const preset = this.themeService.presets.find(
      p => p.value === presetValue
    );
    if (preset) {
      this.selectedPreset = presetValue;
      this.brandingForm.patchValue(preset.theme);
    }
  }

  previewInBrowser(): void {
    const values = this.brandingForm.value as Theme;
    this.themeService.applyTheme(values);
  }

  onSubmit(): void {
    if (this.brandingForm.invalid) return;

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const theme = this.brandingForm.value as Theme;

    this.photographerService.updateProfile({ theme }).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Branding saved successfully!';
        this.themeService.applyTheme(theme);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save. Please try again.';
      }
    });
  }

}

