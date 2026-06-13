
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Theme } from '../models/photographer.model';
 
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
 
  private renderer: Renderer2;
 
  // Default PhotoMate dark luxury theme
  defaultTheme: Theme = {
    primaryColor:    '#111111',
    accentColor:     '#c9a96e',
    backgroundColor: '#111111',
    textColor:       '#ffffff',
    font:            'Poppins',
    layout:          'luxury-dark',
    heroStyle:       'centered'
  };
 
  // 3 preset themes for branding page
  presets = [
    {
      name:  'Luxury Dark',
      value: 'luxury-dark',
      theme: {
        primaryColor:    '#111111',
        accentColor:     '#c9a96e',
        backgroundColor: '#111111',
        textColor:       '#ffffff',
        font:            'Poppins',
        layout:          'luxury-dark' as const,
        heroStyle:       'centered' as const
      }
    },
    {
      name:  'Minimal Light',
      value: 'minimal-light',
      theme: {
        primaryColor:    '#ffffff',
        accentColor:     '#2d2d2d',
        backgroundColor: '#f8f8f8',
        textColor:       '#111111',
        font:            'Inter',
        layout:          'minimal-light' as const,
        heroStyle:       'split' as const
      }
    },
    {
      name:  'Bold Dark',
      value: 'bold-dark',
      theme: {
        primaryColor:    '#0a0a0a',
        accentColor:     '#e63946',
        backgroundColor: '#0a0a0a',
        textColor:       '#ffffff',
        font:            'Montserrat',
        layout:          'bold-dark' as const,
        heroStyle:       'fullscreen' as const
      }
    }
  ];
 
  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }
 
  // -----------------------------------------------
  // Apply theme CSS variables to document root
  // Called on public portfolio/gallery pages
  // -----------------------------------------------
  applyTheme(theme: Theme): void {
    const root = document.documentElement;
 
    root.style.setProperty('--color-primary',    theme.primaryColor);
    root.style.setProperty('--color-accent',      theme.accentColor);
    root.style.setProperty('--color-bg',          theme.backgroundColor);
    root.style.setProperty('--color-text',        theme.textColor);
    root.style.setProperty('--font-primary',      theme.font);
 
    // Load Google Font dynamically
    this.loadFont(theme.font);
  }
 
  // -----------------------------------------------
  // Reset to PhotoMate default dark theme
  // Called in ngOnDestroy of public components
  // -----------------------------------------------
  resetToDefault(): void {
    this.applyTheme(this.defaultTheme);
  }
 
  // -----------------------------------------------
  // Dynamically load Google Font
  // -----------------------------------------------
  private loadFont(font: string): void {
    const fontMap: { [key: string]: string } = {
      'Poppins':          'Poppins:wght@300;400;500;600;700',
      'Inter':            'Inter:wght@300;400;500;600;700',
      'Montserrat':       'Montserrat:wght@300;400;500;600;700',
      'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
      'Lato':             'Lato:wght@300;400;700'
    };
 
    const fontQuery = fontMap[font] || fontMap['Poppins'];
 
    // Remove existing dynamic font link
    const existing = document.getElementById('dynamic-font');
    if (existing) existing.remove();
 
    // Create and inject new font link
    const link = this.renderer.createElement('link');
    link.id   = 'dynamic-font';
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
    document.head.appendChild(link);
  }
 
}