import { HttpClient, HttpRequest, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, map, filter } from 'rxjs';

// FIX: ఇంటర్‌ఫేస్ పైనుంచి @Injectable() డెకరేటర్ తీసివేయబడింది
export interface UploadProgress {
  progress: number;
  publicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  done: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  // FIX 5 + 14: Strict file validation
  readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  readonly ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif'
  ];

  readonly MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

  constructor(
    private http: HttpClient,
    private functions: Functions
  ) {}

  // Validate file before requesting signature
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Use JPG, PNG, WebP, or GIF.`
      };
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File extension not allowed.`
      };
    }

    // Check size
    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        valid: false,
        error: `File too large (${sizeMB}MB). Maximum is 20MB.`
      };
    }

    // Check for zero-byte files
    if (file.size === 0) {
      return { valid: false, error: 'File is empty.' };
    }

    return { valid: true };
  }

  // STEP 1: Get upload signature from Firebase Function
  // FIX 4: Only send galleryId - server controls folder
  getUploadSignature(galleryId: string): Observable<any> {
    const fn = httpsCallable(
      this.functions,
      'generateCloudinarySignature'
    );
    return from(fn({ galleryId })).pipe(
      map((result: any) => result.data)
    );
  }

  // STEP 2: Upload directly to Cloudinary with progress
  uploadFile(
    file: File,
    signatureData: any
  ): Observable<UploadProgress> {
    const {
      cloudName,
      apiKey,
      signature,
      timestamp,
      folder,
      allowedFormats,
      maxFileSize
    } = signatureData;

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);

    // FIX 5: Include signed restrictions
    if (allowedFormats) {
      formData.append('allowed_formats', allowedFormats);
    }
    if (maxFileSize) {
      formData.append('max_file_size', maxFileSize.toString());
    }

    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      filter(event =>
        event.type === HttpEventType.UploadProgress ||
        event.type === HttpEventType.Response
      ),
      map((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(
            (100 * event.loaded) / (event.total || 1)
          );
          return { progress, done: false };
        }
        const body = event.body;
        return {
          progress: 100,
          done: true,
          publicId:  body.public_id,
          secureUrl: body.secure_url,
          width:     body.width,
          height:    body.height
        };
      })
    );
  }

  // Build optimized Cloudinary URL
  buildUrl(
    cloudName: string,
    publicId: string,
    transformations = 'f_auto,q_auto,w_auto,dpr_auto'
  ): string {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
  }

  buildThumbnail(
    cloudName: string,
    publicId: string,
    width = 400,
    height = 300
  ): string {
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,w_${width},h_${height}/${publicId}`;
  }

}