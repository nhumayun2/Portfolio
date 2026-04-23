import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="group relative flex flex-col h-full w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#2A0E61] bg-[#0300145e] backdrop-blur-md transition-all duration-300 hover:border-[#7042f88b] hover:shadow-[0_0_30px_rgba(112,66,248,0.15)]"
    >
      <div class="relative aspect-video w-full overflow-hidden">
        <img
          [src]="image || '/p1.svg'"
          [alt]="title"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#030014] to-transparent opacity-60"
        ></div>
      </div>

      <div class="flex flex-1 flex-col p-6">
        <h3
          class="text-2xl font-bold text-white tracking-tight group-hover:text-purple-400 transition-colors"
        >
          {{ title }}
        </h3>

        <p class="mt-3 text-sm leading-relaxed text-gray-400 line-clamp-3">
          {{ description }}
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
          @for (tech of techStack; track tech) {
            <span
              class="rounded-md border border-white/[0.1] bg-[#10132e] px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-purple-200"
            >
              {{ tech }}
            </span>
          }
        </div>

        <div class="mt-auto pt-6">
          <a
            [href]="link"
            target="_blank"
            class="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-cyan-400"
          >
            Live Preview
            <i class="fas fa-external-link-alt text-xs"></i>
          </a>
        </div>
      </div>

      <div
        class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-[50px] transition-opacity group-hover:opacity-100 opacity-0"
      ></div>
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
  @Input() link: string = '';
}
