// src/app/components/skills/skills.component.ts
import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  Inject,
} from '@angular/core'; // Import PLATFORM_ID, Inject
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Import isPlatformBrowser

// Swiper types (ensure you have the correct path if Swiper version differs)
import { SwiperOptions } from 'swiper/types';
// Note: `register()` should now be in main.ts

interface Skill {
  icon: string;
  title: string;
  items: string[];
  accentColorVar: string;
}

// Define the type for Swiper container element if not globally available
// This helps with type checking for nativeElement properties like initialize
interface HTMLSwiperContainerElement extends HTMLElement {
  swiper: any; // Swiper instance
  initialize: () => void; // Method we are calling
  // Add other Swiper Element properties/methods if you use them directly
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SkillsComponent implements AfterViewInit {
  @ViewChild('skillsSwiper')
  skillsSwiperRef!: ElementRef<HTMLSwiperContainerElement>;

  skills: Skill[] = [
    /* ... your skills array ... */
    {
      icon: 'fas fa-code',
      title: 'Programming Languages',
      items: [
        'JavaScript (ES6+)',
        'Java',
        'Python',
        'C++',
        'C#',
        'HTML5 & CSS3',
      ],
      accentColorVar: 'var(--color-brand-primary)',
    },
    {
      icon: 'fas fa-globe',
      title: 'Web Development',
      items: [
        'Angular, React',
        'Tailwind CSS, Bootstrap',
        'PHP, ASP.NET Core',
        'RESTful API Integration',
        'State Management',
      ],
      accentColorVar: 'var(--color-brand-secondary)',
    },
    {
      icon: 'fas fa-database',
      title: 'Database Management',
      items: [
        'SQL Database Design',
        'MySQL',
        'PostgreSQL',
        'NoSQL (MongoDB basics)',
      ],
      accentColorVar: 'var(--color-brand-highlight)',
    },
    {
      icon: 'fas fa-laptop-code',
      title: 'Software Development',
      items: [
        'Agile Methodologies',
        'Version Control (Git & GitHub)',
        'Testing & Debugging',
        'Problem-Solving',
      ],
      accentColorVar: 'var(--color-brand-primary)',
    },
    {
      icon: 'fas fa-tools',
      title: 'Tools & Platforms',
      items: [
        'VS Code',
        'Angular CLI',
        'npm & yarn',
        'Docker (Basics)',
        'Firebase',
      ],
      accentColorVar: 'var(--color-brand-secondary)',
    },
    {
      icon: 'fas fa-brain',
      title: 'Continuous Learning',
      items: [
        'Exploring new tech',
        'Reading documentation',
        'Side projects',
        'Open Source contributions',
      ],
      accentColorVar: 'var(--color-brand-highlight)',
    },
  ];

  swiperParams: SwiperOptions = {
    /* ... your swiperConfig (I renamed to swiperParams for clarity) ... */
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    loop: true,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    coverflowEffect: {
      rotate: 25,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: false,
    },
    pagination: {
      el: '.swiper-pagination-skills',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next-skills',
      prevEl: '.swiper-button-prev-skills',
    },
    breakpoints: {
      320: { slidesPerView: 1.5, spaceBetween: 15 },
      640: { slidesPerView: 2.2, spaceBetween: 20 },
      1024: { slidesPerView: 2.8, spaceBetween: 30 },
    },
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {} // Inject PLATFORM_ID

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // CHECK if running in browser
      if (this.skillsSwiperRef?.nativeElement) {
        const swiperEl = this.skillsSwiperRef.nativeElement;
        Object.assign(swiperEl, this.swiperParams);

        // Check if initialize is a function before calling, just in case
        if (typeof swiperEl.initialize === 'function') {
          swiperEl.initialize();
        } else {
          // This might happen if the element isn't fully a Swiper custom element yet.
          // Sometimes a micro-task delay can help, but ideally, `register()` in main.ts and `isPlatformBrowser` handles it.
          console.error(
            'Swiper element "initialize" method not found immediately. Swiper may initialize automatically once properties are set, or there might be a timing issue with custom element registration.'
          );
          // setTimeout(() => { // As a last resort for timing, but usually not needed with proper setup
          //   if (typeof swiperEl.initialize === 'function') {
          //     swiperEl.initialize();
          //   }
          // }, 0);
        }
      }
    }
  }
}
