import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Skill } from '../../services/portfolio';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
})
export class SkillsComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  skills = signal<Skill[]>([]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSkills();
    }
  }

  loadSkills(): void {
    this.portfolioService.getSkills().subscribe({
      next: (data) => this.skills.set(data),
      error: (err) => console.error('Error fetching skills:', err),
    });
  }
}
