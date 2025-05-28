import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
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
                animate('300ms ease-out', style({
                    transform: 'scaleY(1)',
                    opacity: 1,
                    height: '*',
                    overflow: 'hidden',
                })),
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({
                    transform: 'scaleY(0)',
                    opacity: 0,
                    height: '0px',
                    overflow: 'hidden',
                })),
            ]),
        ]),
    ]
})
export class HeaderComponent {
  isMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    console.log(
      'Mobile menu button clicked. isMenuOpen is now:',
      this.isMenuOpen
    ); // For debugging
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
