import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-skill-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #iconContainer class="opacity-0 translate-y-10">
      <img
        [src]="'/skills/' + src"
        [alt]="name"
        [width]="width"
        [height]="height"
        class="object-contain"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SkillIconComponent implements AfterViewInit {
  @Input() src!: string;
  @Input() name!: string;
  @Input() width: number = 80;
  @Input() height: number = 80;
  @Input() index: number = 0;

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }

  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateIn();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(this.el.nativeElement);
  }

  private animateIn(): void {
    const target = this.el.nativeElement.querySelector('div');

    // delay is based on the index to create the staggered "wave" effect
    // found in the primary template
    gsap.to(target, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: this.index * 0.1,
      ease: 'power2.out',
    });
  }
}
