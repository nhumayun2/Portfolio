import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { HeroComponent } from './components/hero/hero.component';
import { HeaderComponent } from './shared/header/header.component';
import { SkillsComponent } from './components/skills/skills.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        AboutComponent,
        HeaderComponent,
        HeroComponent,
        SkillsComponent,
        PortfolioComponent,
        ContactComponent,
        FooterComponent,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'my-portfolio-app';
}
