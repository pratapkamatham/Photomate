import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyImage]'
})
export class LazyImageDirective implements OnInit {
 private observer!: IntersectionObserver;
 
  constructor(private el: ElementRef) {}
 
  ngOnInit(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const src = img.getAttribute('data-src');
 
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && src) {
          img.src = src;
          img.removeAttribute('data-src');
          this.observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
 
    this.observer.observe(img);
  }

}
