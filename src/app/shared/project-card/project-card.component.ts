import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col h-full w-full max-w-[450px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d1126] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(163,136,245,0.15)]"
    >
      <div
        class="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-white/[0.05]"
      >
        <img
          [src]="image || '/hero-bg.svg'"
          [alt]="title"
          class="h-full w-full object-cover"
        />
      </div>

      <div class="flex flex-1 flex-col p-6">
        <h3 class="text-2xl font-bold text-white tracking-tight">
          {{ title }}
        </h3>

        <p class="mt-3 text-sm leading-relaxed text-gray-400 line-clamp-3">
          {{ description }}
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          @for (tech of techStack; track tech) {
            <span
              class="rounded bg-[#1a1f3c] px-2 py-1 text-[11px] font-semibold text-[#a388f5] border border-white/[0.05]"
            >
              {{ tech }}
            </span>
          }
        </div>

        <div class="mt-auto pt-6 flex flex-wrap gap-3">
          @if (liveUrl) {
            <a
              [href]="liveUrl"
              target="_blank"
              class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#a388f5]/10 px-4 py-2 text-sm font-semibold text-[#a388f5] transition-colors hover:bg-[#a388f5] hover:text-white border border-[#a388f5]/20"
            >
              <i class="fas fa-external-link-alt text-xs"></i>
              Live Demo
            </a>
          }

          @if (gitHubUrl) {
            <a
              [href]="gitHubUrl"
              target="_blank"
              class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] border border-white/[0.05]"
            >
              <i class="fab fa-github text-xs"></i>
              Source Code
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ProjectCardComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() image: string = '';
  @Input() techStack: string[] = [];
  @Input() liveUrl: string = '';
  @Input() gitHubUrl: string = '';
}
