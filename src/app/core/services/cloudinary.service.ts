import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, throwError } from 'rxjs';
import { map, filter, catchError, tap } from 'rxjs/operators';

export interface UploadProgress {
  progress: number;
  publicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  done: boolean;
  error?: string;
}

export interface PreparedUpload {
  file: File;
  originalSize: number;
  compressed: boolean;
  width?: number;
  height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

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

  readonly CLOUDINARY_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  readonly MAX_ORIGINAL_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  readonly MAX_IMAGE_EDGE_PX = 3000;

  constructor(
    private http: HttpClient,
    private functions: Functions
  ) {}

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Use JPG, PNG, WebP, or GIF.`
      };
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File extension not allowed.`
      };
    }

    if (file.size > this.MAX_ORIGINAL_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const maxMB = (this.MAX_ORIGINAL_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: `File too large (${sizeMB}MB). Maximum is ${maxMB}MB.`
      };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty.' };
    }

    return { valid: true };
  }

  async prepareFileForUpload(file: File): Promise<PreparedUpload> {
    if (file.size <= this.CLOUDINARY_MAX_FILE_SIZE_BYTES) {
      return {
        file,
        originalSize: file.size,
        compressed: false
      };
    }

    if (file.type === 'image/gif') {
      throw new Error('GIF is too large. Animated GIF compression is not supported yet. Please upload a GIF under 10MB.');
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('This image type cannot be compressed in the browser.');
    }

    const image = await this.loadImage(file);
    const scale = Math.min(
      1,
      this.MAX_IMAGE_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not prepare image compression.');
    }

    ctx.drawImage(image, 0, 0, width, height);
    URL.revokeObjectURL(image.src);

    const qualities = [0.84, 0.78, 0.72, 0.66, 0.6];
    let compressedFile: File | null = null;

    for (const quality of qualities) {
      const blob = await this.canvasToBlob(canvas, 'image/jpeg', quality);
      compressedFile = new File(
        [blob],
        this.toJpegFileName(file.name),
        { type: 'image/jpeg', lastModified: Date.now() }
      );

      if (compressedFile.size <= this.CLOUDINARY_MAX_FILE_SIZE_BYTES) {
        break;
      }
    }

    if (!compressedFile || compressedFile.size > this.CLOUDINARY_MAX_FILE_SIZE_BYTES) {
      throw new Error('Image is still above 10MB after optimization. Please compress it manually and try again.');
    }

    console.log('[Cloudinary Upload] image optimized', {
      originalName: file.name,
      originalSizeMb: (file.size / 1024 / 1024).toFixed(2),
      optimizedName: compressedFile.name,
      optimizedSizeMb: (compressedFile.size / 1024 / 1024).toFixed(2),
      width,
      height
    });

    return {
      file: compressedFile,
      originalSize: file.size,
      compressed: true,
      width,
      height
    };
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        URL.revokeObjectURL(image.src);
        reject(new Error('Could not read image for optimization.'));
      };
      image.src = URL.createObjectURL(file);
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Could not compress image.'));
          return;
        }
        resolve(blob);
      }, type, quality);
    });
  }

  private toJpegFileName(name: string): string {
    return name.replace(/\.[^.]+$/, '') + '.jpg';
  }

  getUploadSignature(galleryId: string): Observable<any> {
    const fn = httpsCallable(
      this.functions,
      'generateCloudinarySignature'
    );
    return from(fn({ galleryId })).pipe(
      map((result: any) => result.data)
    );
  }

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
    const maskedApiKey = `${apiKey}`.replace(/\d(?=\d{4})/g, '*');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);

    if (allowedFormats) {
      formData.append('allowed_formats', allowedFormats);
    }
    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true
    });

    console.groupCollapsed('[Cloudinary Upload] starting');
    console.table({
      cloudName,
      apiKey: maskedApiKey,
      folder,
      timestamp,
      allowedFormats,
      maxFileSize,
      signatureLength: signature?.length,
      signaturePreview: signature ? `${signature.substring(0, 6)}...${signature.substring(signature.length - 4)}` : '',
      fileName: file.name,
      fileType: file.type,
      fileSizeMb: (file.size / 1024 / 1024).toFixed(2)
    });
    console.groupEnd();

    return this.http.request(req).pipe(
      tap((event: any) => {
        if (event.type === HttpEventType.Response) {
          console.log('[Cloudinary Upload] success', {
            publicId: event.body?.public_id,
            secureUrl: event.body?.secure_url,
            width: event.body?.width,
            height: event.body?.height
          });
        }
      }),
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
      }),
      catchError((err: any) => {
        const cloudinaryMessage =
          err?.error?.error?.message ||
          err?.error?.message ||
          err?.message ||
          'Cloudinary upload failed.';

        console.error('[Cloudinary Upload] failed', {
          status: err?.status,
          statusText: err?.statusText,
          message: cloudinaryMessage,
          cloudName,
          apiKey: maskedApiKey,
          folder,
          timestamp,
          allowedFormats,
          maxFileSize,
          signatureLength: signature?.length,
          fileName: file.name,
          fileType: file.type,
          fileSizeMb: (file.size / 1024 / 1024).toFixed(2),
          rawError: err?.error
        });

        return throwError(() => new Error(cloudinaryMessage));
      })
    );
  }

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
