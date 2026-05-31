import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinaryUrl'
})
export class CloudinaryUrlPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
