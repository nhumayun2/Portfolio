import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private portfolioService = inject(PortfolioService);

  // Signal to hold your live profile data
  profile = signal<Profile | null>(null);

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
}
