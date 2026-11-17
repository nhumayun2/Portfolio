import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService, Project } from '../../services/portfolio';
import { SoundService } from '../../services/sound.service';
import { ProjectsCanvasComponent } from './projects-canvas.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, ProjectsCanvasComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  public soundService = inject(SoundService);

  projects = signal<Project[]>([]);

  ngOnInit(): void {
    this.loadProjects();
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

  onHover(): void {
    this.soundService.playHoverBlip();
  }
}
