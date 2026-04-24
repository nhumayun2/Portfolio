import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
})
export class LoadingComponent {
  /**
   * Optional text to show under the black hole.
   * "Scanning Spacetime..." or "Waking up Backend..."
   */
  @Input() message: string = 'Syncing with the Event Horizon...';
}
