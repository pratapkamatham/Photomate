import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinaryUrl'
})
export class CloudinaryUrlPipe implements PipeTransform {

  transform(publicId:string,cloudName:string,transformations:string='f_auto,q_auto,w_auto,dpr_auto'):string{
    if(!publicId || !cloudName) return '';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
  }

}
