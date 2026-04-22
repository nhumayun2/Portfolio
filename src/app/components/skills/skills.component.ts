import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  Inject,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SwiperOptions } from 'swiper/types';
import { PortfolioService, Skill } from '../../services/portfolio';

interface HTMLSwiperContainerElement extends HTMLElement {
  swiper: any;
  initialize: () => void;
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
export class SkillsComponent implements OnInit, AfterViewInit {
  @ViewChild('skillsSwiper')
  skillsSwiperRef!: ElementRef<HTMLSwiperContainerElement>;

  private portfolioService = inject(PortfolioService);

  // Using a Signal to hold your skills data
  skills = signal<Skill[]>([]);

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.portfolioService.getSkills().subscribe({
      next: (data) => {
        this.skills.set(data);

        // Wait for Angular to render the dynamic slides, then initialize Swiper
        setTimeout(() => {
          this.initSwiper();
        }, 0);
      },
      error: (err) => {
        console.error('Error fetching skills:', err);
      },
    });
  }

  ngAfterViewInit(): void {
    // We moved initialization to loadSkills() so it waits for the database data.
    // If the data was empty initially, Swiper would initialize with 0 slides.
  }

  initSwiper(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.skillsSwiperRef?.nativeElement) {
        const swiperEl = this.skillsSwiperRef.nativeElement;
        Object.assign(swiperEl, this.swiperParams);

        if (typeof swiperEl.initialize === 'function') {
          swiperEl.initialize();
        } else {
          console.error('Swiper element "initialize" method not found.');
        }
      }
    }
  }
}
