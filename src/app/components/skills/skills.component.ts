// src/app/components/skills/skills.component.ts
import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from '@angular/core'; // Added CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild
import { CommonModule } from '@angular/common';

// Import and register Swiper custom elements
import { register } from 'swiper/element/bundle'; // For all Swiper elements
// Alternatively, import specific elements if you know them:
// import { SwiperContainer, SwiperSlide } from 'swiper/element';
// register() needs to be called once to register Swiper components
register();

// Swiper types can still be useful for config if available and correctly typed
// For Swiper 11+, SwiperOptions might come from 'swiper/types'
import { SwiperOptions } from 'swiper/types';

interface Skill {
  icon: string;
  title: string;
  items: string[];
  accentColorVar: string;
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule], // SwiperModule is NOT imported here when using Swiper Elements directly
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add CUSTOM_ELEMENTS_SCHEMA to allow custom HTML tags
})
export class SkillsComponent implements AfterViewInit {
  // Access the swiper-container element
  @ViewChild('skillsSwiper')
  skillsSwiperRef!: ElementRef<HTMLElement>; // Use HTMLElement as Swiper custom element type

  skills: Skill[] = [
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

  // Swiper configuration object
  // For Swiper Elements, options are often set as attributes or properties
  swiperParams: SwiperOptions = {
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
      rotate: 25, // Rotation of side slides
      stretch: 0,
      depth: 100, // Depth offset of side slides
      modifier: 1, // Effect multiplier
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
      640: { slidesPerView: 2.2, spaceBetween: 20 }, // Adjusted for potentially better coverflow visuals
      1024: { slidesPerView: 2.8, spaceBetween: 30 }, // Adjusted
    },
    // Modules need to be available if used by Swiper Elements implicitly,
    // `register()` from 'swiper/element/bundle' usually includes common modules.
  };

  constructor() {}

  ngAfterViewInit(): void {
    // Assign parameters to the Swiper custom element
    if (this.skillsSwiperRef?.nativeElement) {
      Object.assign(this.skillsSwiperRef.nativeElement, this.swiperParams);
      // Initialize the swiper (important for Swiper Element)
      (this.skillsSwiperRef.nativeElement as any).initialize();
    }
  }
}
