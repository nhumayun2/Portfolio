import {
  Component,
  Input,
  signal,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../utils/cn';
import { BackgroundGradientComponent } from '../background-gradient/background-gradient.component';
import { GlobeComponent } from '../globe/globe.component';

@Component({
  selector: 'app-bento-grid-item',
  standalone: true,
  imports: [CommonModule, BackgroundGradientComponent, GlobeComponent],
  template: `
    <div
      #container
      [class]="
        cn(
          'group/bento relative row-span-1 flex flex-col justify-between space-y-4 overflow-hidden rounded-3xl border border-white/[0.1] shadow-input transition duration-300 hover:shadow-2xl hover:border-white/[0.2] p-4',
          className
        )
      "
      style="background: #04071d;"
      (mousemove)="handleMouseMove($event)"
    >
      <div
        class="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover/bento:opacity-100"
        [style.background]="spotlightGradient()"
      ></div>

      <div
        [class]="
          cn('h-full w-full relative z-10', id === 6 && 'flex justify-center')
        "
      >
        <div
          class="absolute h-full w-full left-0 top-0 overflow-hidden rounded-3xl"
        >
          @if (img) {
            <img
              [src]="img"
              [alt]="img"
              [class]="
                cn(
                  'object-cover object-center w-full h-full opacity-40 transition-transform duration-500 group-hover/bento:scale-110',
                  imgClassName
                )
              "
            />
          }
        </div>

        <div
          [class]="
            cn('absolute right-0 -mb-5', id === 5 && 'w-full opacity-80')
          "
        >
          @if (spareImg) {
            <img
              [src]="spareImg"
              [alt]="spareImg"
              class="h-full w-full object-cover object-center"
            />
          }
        </div>

        @if (id === 6) {
          <app-background-gradient />
        }

        @if (id === 2) {
          <div
            class="absolute -right-10 -bottom-20 w-full h-full z-0 opacity-60"
          >
            @defer (on viewport) {
              <app-globe />
            } @placeholder {
              <div class="w-full h-full"></div>
            }
          </div>
        }

        <div
          [class]="
            cn(
              'relative flex min-h-40 flex-col p-5 transition duration-200 group-hover/bento:translate-x-1 md:h-full lg:p-10 z-20',
              id === 2 ? 'justify-start' : titleClassName
            )
          "
        >
          <div
            class="font-sans text-sm font-extralight text-[#c1c2d3] md:text-xs lg:text-base"
          >
            {{ description }}
          </div>

          <div
            class="max-w-96 font-sans text-lg font-bold lg:text-3xl text-white leading-tight"
          >
            {{ title }}
          </div>

          @if (id === 3) {
            <div
              class="flex gap-1 lg:gap-5 w-fit absolute -right-3 lg:-right-2 top-0 h-full items-center"
            >
              <div class="flex flex-col gap-3 lg:gap-8">
                @for (item of ['Angular', 'TS', 'Tailwind']; track item) {
                  <span
                    class="rounded-lg bg-[#10132e] px-3 py-2 text-center text-xs border border-white/[0.05] text-purple-200 animate-pulse"
                    [style.animation-delay]="item"
                  >
                    {{ item }}
                  </span>
                }
              </div>
              <div class="flex flex-col gap-3 lg:gap-8 mt-10">
                @for (item of ['.NET 10', 'Postgres', 'Docker']; track item) {
                  <span
                    class="rounded-lg bg-[#10132e] px-3 py-2 text-center text-xs border border-white/[0.05] text-blue-200 animate-pulse"
                    [style.animation-delay]="item"
                  >
                    {{ item }}
                  </span>
                }
              </div>
            </div>
          }

          @if (id === 6) {
            <div class="mt-5 relative z-30">
              <button
                (click)="handleCopy()"
                class="relative inline-flex h-12 overflow-hidden rounded-lg p-[1px] focus:outline-none w-full transform transition-transform active:scale-95"
              >
                <span
                  class="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
                ></span>
                <span
                  class="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#161a31] px-7 text-sm font-medium text-white backdrop-blur-3xl"
                >
                  {{ copied() ? 'Email Copied!' : 'Copy My Email' }}
                  <i
                    [class]="
                      copied() ? 'fas fa-check text-green-400' : 'far fa-copy'
                    "
                  ></i>
                </span>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class BentoGridItemComponent {
  @Input() id!: number;
  @Input() title?: string;
  @Input() description?: string;
  @Input() className?: string;
  @Input() img?: string;
  @Input() imgClassName?: string;
  @Input() titleClassName?: string;
  @Input() spareImg?: string;
  @Input() email: string = 'nhumayun291@gmail.com';

  copied = signal(false);
  spotlightGradient = signal('');
  cn = cn;

  handleMouseMove(event: MouseEvent) {
    const { clientX, clientY, currentTarget } = event;
    const { left, top } = (
      currentTarget as HTMLElement
    ).getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;

    this.spotlightGradient.set(
      `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`,
    );
  }

  async handleCopy() {
    navigator.clipboard.writeText(this.email);
    this.copied.set(true);

    // Trigger Confetti!
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a78bfa', '#34d399', '#60a5fa'],
    });

    setTimeout(() => this.copied.set(false), 3000);
  }
}
