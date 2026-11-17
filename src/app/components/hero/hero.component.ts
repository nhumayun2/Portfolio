import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';
import { SoundService } from '../../services/sound.service';
import { LiquidChromeCanvasComponent } from './liquid-chrome-canvas.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, LiquidChromeCanvasComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements OnInit, OnDestroy {
  public portfolioService = inject(PortfolioService);
  public soundService = inject(SoundService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  profile = signal<Profile | null>(null);
  currentTime = signal<string>('00:00:00');
  private clockTimer: any = null;

  ngOnInit(): void {
    this.loadProfile();
    this.startClock();
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Error fetching profile:', err),
    });
  }

  private startClock(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.updateClock();
    this.ngZone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => {
        this.updateClock();
      }, 1000);
    });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }

  onHover(): void {
    this.soundService.playHoverBlip();
  }

  toggleSound(): void {
    this.soundService.toggleSound();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }
}
