import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';
import { SoundService } from '../../services/sound.service';
import { AboutCanvasComponent } from './about-canvas.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, AboutCanvasComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  public soundService = inject(SoundService);

  profile = signal<Profile | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Error fetching profile:', err),
    });
  }

  onHover(): void {
    this.soundService.playHoverBlip();
  }
}
