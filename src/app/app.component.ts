import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { StarBackgroundComponent } from './shared/star-background/star-background.component';
import { LoadingComponent } from './shared/loading/loading.component';
import { PortfolioService } from './services/portfolio';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    RouterOutlet,
    StarBackgroundComponent,
    LoadingComponent, // Added this
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // App starts in loading state to hide the Render "cold start"
  isLoading = signal(true);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.handleAppLoading();
    }
  }

  private handleAppLoading(): void {
    // We fetch the profile. Once Render wakes up and sends this, we drop the loader.
    this.portfolioService.getProfile().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false), // Hide even on error so user isn't stuck
    });
  }
}
