import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';
import { SoundService } from '../../services/sound.service';
import { ContactCanvasComponent } from './contact-canvas.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ContactCanvasComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  public soundService = inject(SoundService);

  profile = signal<Profile | null>(null);
  copied = signal<boolean>(false);

  ngOnInit(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
      },
      error: (err) => {
        console.error('Error fetching profile for Contact section:', err);
      },
    });
  }

  copyEmail(): void {
    const email = this.profile()?.email || 'nhumayun291@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      this.copied.set(true);
      this.soundService.playClickSnap();
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  onHover(): void {
    this.soundService.playHoverBlip();
  }
}
