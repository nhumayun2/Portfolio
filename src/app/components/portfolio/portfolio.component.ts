import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Project } from '../../services/portfolio';
import { ProjectCardComponent } from '../../shared/project-card/project-card.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent], // Replaced PinCard with ProjectCard
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signal to hold the array of projects from your PostgreSQL database
  projects = signal<Project[]>([]);

  ngOnInit(): void {
    // Only fetch data if we are in the browser to prevent SSR Timeout errors
    if (isPlatformBrowser(this.platformId)) {
      this.loadProjects();
    }
  }

  loadProjects(): void {
    this.portfolioService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
      },
    });
  }

  /**
   * Simple helper to ensure techStack is always an array for the card.
   * Since your interface already defines it as string[], this is just a safety.
   */
  getTechStack(project: Project): string[] {
    return project.techStack || ['Fullstack'];
  }
}
