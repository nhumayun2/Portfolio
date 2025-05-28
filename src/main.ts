// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { register } from 'swiper/element/bundle'; // Import Swiper's register function

register(); // Call register once, globally, before bootstrapping

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
