import { Component, Input, HostBinding, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from '../globe/globe.component'; // Adjust path if your globe is somewhere else!

@Component({
  selector: 'app-bento-grid-item',
  standalone: true,
  imports: [CommonModule, GlobeComponent],
  templateUrl: './bento-grid-item.component.html',
  styleUrl: './bento-grid-item.component.css',
})
export class BentoGridItemComponent {
  @Input() id!: number;
  @Input() title!: string;
  @Input() description!: string;
  @Input() className?: string = '';
  @Input() img?: string;
  @Input() imgClassName?: string = '';
  @Input() titleClassName?: string = '';
  @Input() spareImg?: string;
  @Input() email?: string;

  @Input() showCvButton?: boolean = false;
  @Input() cvUrl?: string | null | undefined = '';

  // For ID 6: Email copy animation state
  copied = signal(false);

  // For ID 3: Tech Stack lists
  leftLists = ['Angular', 'TypeScript', 'Tailwind'];
  rightLists = ['.NET 10', 'PostgreSQL', 'Docker'];

  @HostBinding('class') get hostClasses() {
    return this.className;
  }

  copyEmail(event: Event) {
    event.stopPropagation();
    if (this.email) {
      navigator.clipboard.writeText(this.email);
      this.copied.set(true);

      // Reset the button text after 2 seconds
      setTimeout(() => {
        this.copied.set(false);
      }, 2000);
    }
  }

  downloadCV(event: Event) {
    event.stopPropagation();
    if (this.cvUrl) {
      window.open(this.cvUrl, '_blank');
    } else {
      alert(
        'CV is currently being updated. Please check back soon or contact me directly!',
      );
    }
  }
}
