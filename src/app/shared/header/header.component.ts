import { Component, HostListener, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule],
  animations: [
    trigger('menuToggle', [
      transition(':enter', [
        style({
          transform: 'scaleY(0)',
          opacity: 0,
          height: '0px',
          overflow: 'hidden',
        }),
        animate(
          '300ms ease-out',
          style({
            transform: 'scaleY(1)',
            opacity: 1,
            height: '*',
            overflow: 'hidden',
          }),
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({
            transform: 'scaleY(0)',
            opacity: 0,
            height: '0px',
            overflow: 'hidden',
          }),
        ),
      ]),
    ]),
  ],
})
export class HeaderComponent {
  isMenuOpen = false;

  // NEW: Signal to track if the page has been scrolled
  isScrolled = false;

  // Listen for window scroll events
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // If we've scrolled more than 20px, set isScrolled to true
    this.isScrolled = window.scrollY > 20;
  }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
