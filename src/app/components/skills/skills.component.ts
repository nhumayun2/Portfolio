import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService, Skill } from '../../services/portfolio';
import { SoundService } from '../../services/sound.service';
import { SkillsCanvasComponent } from './skills-canvas.component';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, SkillsCanvasComponent],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css'],
})
export class SkillsComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  public soundService = inject(SoundService);

  skills = signal<Skill[]>([]);

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.portfolioService.getSkills().subscribe({
      next: (data) => this.skills.set(data),
      error: (err) => console.error('Error fetching skills:', err),
    });
  }

  onHover(): void {
    this.soundService.playHoverBlip();
  }
}
