import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { cn } from '../utils/cn';

@Component({
  selector: 'app-background-gradient',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="getContainerClass()"
      [style.--gradient-background-start]="gradientBackgroundStart"
      [style.--gradient-background-end]="gradientBackgroundEnd"
      [style.--first-color]="firstColor"
      [style.--second-color]="secondColor"
      [style.--third-color]="thirdColor"
      [style.--fourth-color]="fourthColor"
      [style.--fifth-color]="fifthColor"
      [style.--pointer-color]="pointerColor"
      [style.--size]="size"
      [style.--blending-value]="blendingValue"
    >
      <svg class="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div [class]="cn('relative z-10', className)">
        <ng-content></ng-content>
      </div>

      <div [class]="getGradientsContainerClass()">
        <div
          class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat] left-[calc(50%-var(--size)/2)] top-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)] [transform-origin:center_center] animate-first opacity-100"
        ></div>
        <div
          class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat] left-[calc(50%-var(--size)/2)] top-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)] [transform-origin:calc(50%-400px)] animate-second opacity-100"
        ></div>
        <div
          class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat] left-[calc(50%-var(--size)/2)] top-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)] [transform-origin:calc(50%+400px)] animate-third opacity-100"
        ></div>
        <div
          class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat] left-[calc(50%-var(--size)/2)] top-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)] [transform-origin:calc(50%-200px)] animate-fourth opacity-70"
        ></div>
        <div
          class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat] left-[calc(50%-var(--size)/2)] top-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)] [transform-origin:calc(50%-800px)_calc(50%+800px)] animate-fifth opacity-100"
        ></div>

        @if (interactive) {
          <div
            #interactiveRef
            class="absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat] -left-1/2 -top-1/2 h-full w-full [mix-blend-mode:var(--blending-value)] opacity-70"
          ></div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes first {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(180deg) scale(1.2);
        }
        100% {
          transform: rotate(360deg) scale(1);
        }
      }
      @keyframes second {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(-180deg) scale(1.1);
        }
        100% {
          transform: rotate(-360deg) scale(1);
        }
      }
      @keyframes third {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(90deg) scale(1.3);
        }
        100% {
          transform: rotate(360deg) scale(1);
        }
      }
      @keyframes fourth {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(-90deg) scale(1.2);
        }
        100% {
          transform: rotate(-360deg) scale(1);
        }
      }
      @keyframes fifth {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(180deg) scale(1.1);
        }
        100% {
          transform: rotate(360deg) scale(1);
        }
      }
      .animate-first {
        animation: first 20s infinite linear;
      }
      .animate-second {
        animation: second 20s infinite linear;
      }
      .animate-third {
        animation: third 20s infinite linear;
      }
      .animate-fourth {
        animation: fourth 20s infinite linear;
      }
      .animate-fifth {
        animation: fifth 20s infinite linear;
      }
    `,
  ],
})
export class BackgroundGradientComponent implements OnInit, OnDestroy {
  @ViewChild('interactiveRef') interactiveRef!: ElementRef<HTMLDivElement>;

  // Aceternity UI Configuration Inputs
  @Input() gradientBackgroundStart = 'rgb(108, 0, 162)';
  @Input() gradientBackgroundEnd = 'rgb(0, 17, 82)';
  @Input() firstColor = '18, 113, 255';
  @Input() secondColor = '221, 74, 255';
  @Input() thirdColor = '100, 220, 255';
  @Input() fourthColor = '200, 50, 50';
  @Input() fifthColor = '180, 180, 50';
  @Input() pointerColor = '140, 100, 255';
  @Input() size = '80%';
  @Input() blendingValue = 'hard-light';
  @Input() interactive = true;
  @Input() containerClassName = '';
  @Input() className = '';

  private platformId = inject(PLATFORM_ID);
  private animationFrameId: number = 0;

  // Expose the tailwind merge utility to the template
  cn = cn;
  isSafari = false;

  // Mouse Tracking State
  private curX = 0;
  private curY = 0;
  private tgX = 0;
  private tgY = 0;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );
      this.animate();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.interactiveRef?.nativeElement) {
      const rect =
        this.interactiveRef.nativeElement.parentElement!.getBoundingClientRect();
      this.tgX = event.clientX - rect.left;
      this.tgY = event.clientY - rect.top;
    }
  }

  private animate = () => {
    if (this.interactiveRef?.nativeElement) {
      // Smooth interpolation math
      this.curX += (this.tgX - this.curX) / 20;
      this.curY += (this.tgY - this.curY) / 20;
      this.interactiveRef.nativeElement.style.transform = `translate(${Math.round(this.curX)}px, ${Math.round(this.curY)}px)`;
    }
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  getContainerClass() {
    return cn(
      'absolute left-0 top-0 h-full w-full overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]',
      this.containerClassName,
    );
  }

  getGradientsContainerClass() {
    return cn(
      'gradients-container h-full w-full blur-lg',
      this.isSafari ? 'blur-2xl' : '[filter:url(#blurMe)_blur(40px)]',
    );
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
