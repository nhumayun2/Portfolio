import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex gap-8 pb-12 last:pb-0 group">
      <div class="flex flex-col items-center">
        <div
          [class.bg-purple-500]="isCurrent"
          [class.bg-slate-700]="!isCurrent"
          class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#030014] transition-all duration-300 group-hover:scale-125"
        >
          <div
            *ngIf="isCurrent"
            class="absolute inset-0 animate-ping rounded-full bg-purple-500 opacity-20"
          ></div>
          <i
            [class]="
              isCurrent
                ? 'fas fa-briefcase text-white text-xs'
                : 'fas fa-history text-slate-400 text-xs'
            "
          ></i>
        </div>

        <div
          class="h-full w-[2px] bg-gradient-to-b from-purple-500/50 to-transparent"
        ></div>
      </div>

      <div
        class="flex-1 rounded-2xl border border-white/[0.1] bg-[#0300145e] p-6 backdrop-blur-md transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(112,66,248,0.1)]"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-white tracking-tight">
              {{ jobTitle }}
            </h3>
            <p class="text-purple-400 font-medium">{{ companyName }}</p>
          </div>
          <span
            class="rounded-full bg-[#10132e] px-3 py-1 text-xs font-semibold text-slate-400 border border-white/[0.05]"
          >
            {{ dateRange }}
          </span>
        </div>

        <ul class="mt-6 space-y-3">
          @for (item of responsibilities; track item) {
            <li
              class="flex items-start gap-3 text-sm text-gray-400 leading-relaxed"
            >
              <span
                class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500"
              ></span>
              {{ item }}
            </li>
          }
        </ul>

        <div
          *ngIf="isCurrent"
          class="absolute bottom-2 right-2 h-16 w-16 bg-purple-500/10 blur-2xl rounded-full"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class ExperienceCardComponent {
  @Input() jobTitle: string = '';
  @Input() companyName: string = '';
  @Input() dateRange: string = '';
  @Input() responsibilities: string[] = [];
  @Input() isCurrent: boolean = false;
}
