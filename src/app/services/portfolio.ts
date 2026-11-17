import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth';

export interface Profile {
  id: number;
  fullName: string;
  title: string;
  summary: string;
  email: string;
  phone?: string;
  address?: string;
  websiteUrl?: string;
  gitHubUrl?: string;
  linkedInUrl?: string;
  leetCodeUrl?: string;
  cvUrl?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  liveUrl?: string;
  gitHubUrl?: string;
  startDate?: string;
  endDate?: string;
  techStack: string[];
}

export interface Experience {
  id: number;
  jobTitle: string;
  companyName: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrentRole: boolean;
  responsibilities: string[];
}

export interface Education {
  id: number;
  degree: string;
  institution: string;
  location?: string;
  startYear?: string;
  endYear?: string;
}

export interface Skill {
  id: number;
  title: string;
  icon: string;
  items: string[];
  accentColorVar: string;
}

// ==========================================
// VERIFIED CV CANONICAL DATASETS
// ==========================================
export const CV_PROFILE: Profile = {
  id: 1,
  fullName: "Humayun Ahmed Niloy",
  title: "Software Engineer",
  summary: "Software Engineer specializing in Software Engineering, proficient in JavaScript, Angular, React, Node.js, C#, ASP.NET Core (.NET 10), C++, and Unreal Engine 5. Experienced in full-stack web development, problem-solving, and continuous learning, seeking to apply technical expertise and contribute to innovative projects.",
  email: "nhumayun291@gmail.com",
  phone: "+8801307546966",
  address: "117/1, Daffodils Ln, Mirpur 60 Feet, Dhaka, Bangladesh",
  websiteUrl: "https://humayunahmedportfolio.netlify.app/",
  gitHubUrl: "https://github.com/nhumayun2",
  linkedInUrl: "https://linkedin.com/in/humayun-ahmed-niloy",
  leetCodeUrl: "https://leetcode.com/u/hahmedaiub/",
  cvUrl: "https://res.cloudinary.com/duju8sknw/raw/upload/v1776888792/portfolio-assets/p0xlwqkcaspevprmgzov.pdf",
};

export const CV_EXPERIENCES: Experience[] = [
  {
    id: 1,
    jobTitle: "Frontend Developer",
    companyName: "Berrylabs",
    employmentType: "Full-time",
    location: "Dhaka, Bangladesh",
    startDate: "07/2026",
    endDate: "Present",
    isCurrentRole: true,
    responsibilities: [
      "Developed and maintained responsive, user-friendly web applications using modern frontend technologies, focusing on performance, scalability, and seamless user experience.",
      "Contributed to the development of an e-commerce platform, implementing reusable UI components and integrating frontend functionality with backend APIs.",
      "Worked on a CRM web application, developing dynamic interfaces and business features while ensuring responsive and consistent user experiences.",
      "Collaborated with backend developers and team members to integrate APIs, troubleshoot issues, and deliver reliable end-to-end features.",
      "Contributed to a Flutter-based mobile application, implementing responsive interfaces and integrating application features with backend services."
    ]
  },
  {
    id: 2,
    jobTitle: "Junior Backend Developer",
    companyName: "Betopia Group",
    employmentType: "Full-time",
    location: "Dhaka, Bangladesh",
    startDate: "09/2025",
    endDate: "02/2026",
    isCurrentRole: false,
    responsibilities: [
      "Developed and maintained scalable server-side applications using Node.js and Express.js, ensuring robust performance and reliability.",
      "Built and integrated RESTful APIs for seamless front-end and back-end communication.",
      "Managed MongoDB databases for efficient data handling and optimized query performance."
    ]
  },
  {
    id: 3,
    jobTitle: "Frontend Developer - Intern",
    companyName: "Streams Tech",
    employmentType: "Internship",
    location: "Dhaka, Bangladesh",
    startDate: "10/2024",
    endDate: "03/2025",
    isCurrentRole: false,
    responsibilities: [
      "Designed and developed user-friendly, responsive web interfaces using Angular, Tailwind CSS, and Angular Material UI, delivering solutions meeting specific user requirements.",
      "Collaborated effectively with backend developers working on .NET Core to integrate APIs, ensuring seamless functionality and end-to-end delivery.",
      "Created and implemented scalable, reusable components for dynamic web applications, demonstrating robust architecture relevant to product offerings."
    ]
  }
];

export const CV_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Karigar Leather Works",
    description: "A full-stack ERP system for leather factory management built with ASP.NET Core (.NET 10) and Angular. Implements JWT authentication, inventory & production tracking, client & order management, automated PDF quotation generation, Cloudinary media handling, and an optimized PostgreSQL database with EF Core.",
    imageUrl: "https://res.cloudinary.com/duju8sknw/image/upload/v1776889095/portfolio-assets/rgdssldldzeuwwbeyw9a.png",
    liveUrl: "https://leather-inventory-frontend.vercel.app/",
    gitHubUrl: "https://github.com/nhumayun2/LeatherInventorySystem",
    techStack: ["C#", "ASP.NET Core (.NET 10)", "Angular", "PostgreSQL", "Entity Framework Core", "JWT", "REST API", "Cloudinary", "Docker", "Tailwind CSS"]
  },
  {
    id: 2,
    title: "Tasko",
    description: "Collaborative task manager built using the MERN stack (MongoDB, Express.js, React, Node.js). Allows users to create accounts, authenticate securely, add friends, and collaborate on tasks in real time.",
    imageUrl: "https://res.cloudinary.com/duju8sknw/image/upload/v1776889720/portfolio-assets/g82vpai67afutaiixtym.png",
    liveUrl: "https://taskoapp.netlify.app/",
    gitHubUrl: "https://github.com/nhumayun2/tasko-backend.git",
    techStack: ["MongoDB", "Express.js", "React", "Node.js", "HTML", "CSS", "JavaScript"]
  },
  {
    id: 3,
    title: "HireMe",
    description: "Scalable job posting platform backend featuring role-based access control (RBAC) for Admins, Employees, and Job Seekers. Built with TypeScript and Node.js, utilizing JWT authentication, Multer for CV uploads, and Zod validation.",
    imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
    liveUrl: undefined,
    gitHubUrl: "https://github.com/nhumayun2/HIREME.git",
    techStack: ["TypeScript", "Node.js", "Express.js", "MongoDB", "JWT", "Multer", "Zod", "REST API"]
  },
  {
    id: 4,
    title: "Study Hall",
    description: "Backend-focused collaborative platform built with Node.js, Express.js, and MongoDB. Features JWT authentication, Mongoose relational modeling between students & study sessions, and high-performance REST APIs.",
    imageUrl: "https://res.cloudinary.com/duju8sknw/image/upload/v1776889542/portfolio-assets/a0xcsizycvdaxxu6t9ad.png",
    liveUrl: undefined,
    gitHubUrl: "https://github.com/nhumayun2/Study-Hall-Project.git",
    techStack: ["Node.js", "Express.js", "MongoDB", "Mongoose", "JWT", "REST API"]
  },
  {
    id: 5,
    title: "UE5 Cinematic Sequence: The Last Jedi Is Lost",
    description: "A sci-fi cinematic short created in Unreal Engine 5, showcasing real-time rendering, cinematic sequencing, advanced lighting, and custom character work.",
    imageUrl: "https://res.cloudinary.com/duju8sknw/image/upload/v1776889864/portfolio-assets/jliwponh2pkgkjsy5w1x.png",
    liveUrl: "https://www.youtube.com/watch?v=xIhThfHoyZg",
    gitHubUrl: undefined,
    techStack: ["Unreal Engine 5 (UE5)", "C++", "Blueprints", "Cinematic Sequencing", "Real-Time Rendering"]
  }
];

export const CV_SKILLS: Skill[] = [
  {
    id: 1,
    title: "Programming Languages",
    icon: "fas fa-code",
    accentColorVar: "#84cc16",
    items: ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go (Golang)"]
  },
  {
    id: 2,
    title: "Web & Mobile Development",
    icon: "fas fa-globe",
    accentColorVar: "#38bdf8",
    items: ["Angular", "React", "Node.js", "Express.js", "ASP.NET Core (.NET 10)", "Flutter", "Tailwind CSS", "REST APIs", "HTML5 & CSS3"]
  },
  {
    id: 3,
    title: "Database Management & ORM",
    icon: "fas fa-database",
    accentColorVar: "#a855f7",
    items: ["PostgreSQL", "MongoDB", "MySQL", "Relational Databases", "Entity Framework Core", "Mongoose"]
  },
  {
    id: 4,
    title: "Game & Real-Time Media",
    icon: "fas fa-gamepad",
    accentColorVar: "#ec4899",
    items: ["Unreal Engine 5 (UE5)", "C++ Engine Modules", "Blueprints", "Cinematic Sequencing", "Real-Time Rendering", "Lighting / Post-Processing"]
  },
  {
    id: 5,
    title: "Software Engineering & Tools",
    icon: "fas fa-tools",
    accentColorVar: "#f59e0b",
    items: ["Docker", "Git & GitHub", "CI/CD", "Agile / SDLC", "Software Testing & Debugging", "Postman", "OOP & Design Patterns"]
  },
  {
    id: 6,
    title: "AI-Assisted Engineering",
    icon: "fas fa-robot",
    accentColorVar: "#10b981",
    items: ["Claude via Antigravity", "NotebookLM", "ChatGPT", "Codebase Analysis", "AI Architecture Planning"]
  }
];

export const CV_EDUCATIONS: Education[] = [
  {
    id: 1,
    degree: "BSc in Computer Science & Engineering [Major in Software Engineering]",
    institution: "American International University-Bangladesh (AIUB)",
    location: "Dhaka, Bangladesh",
    startYear: "2020",
    endYear: "2025"
  },
  {
    id: 2,
    degree: "HSC",
    institution: "Bangladesh Navy College - Dhaka",
    location: "Dhaka, Bangladesh",
    startYear: "2017",
    endYear: "2019"
  },
  {
    id: 3,
    degree: "SSC",
    institution: "Shaheed Police Smrity College",
    location: "Dhaka, Bangladesh",
    startYear: "2017",
    endYear: "2017"
  }
];

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'https://portfolioapi-5yq3.onrender.com/api';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // ==========================================
  // PROFILE (Hero / About)
  // ==========================================
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/Profile`).pipe(
      map(res => ({ ...CV_PROFILE, ...res })),
      catchError(() => of(CV_PROFILE))
    );
  }

  updateProfile(profile: Profile): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Profile`, profile, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadCv(file: File): Observable<{ cvUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ cvUrl: string }>(
      `${this.apiUrl}/Profile/cv`,
      formData,
      { headers: this.getAuthHeaders() },
    );
  }

  // ==========================================
  // PROJECTS
  // ==========================================
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/Projects`).pipe(
      map(res => (res && res.length >= 5) ? res : CV_PROJECTS),
      catchError(() => of(CV_PROJECTS))
    );
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/Projects`, project, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProject(id: number, project: Project): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Projects/${id}`, project, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Projects/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadProjectPhoto(id: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(
      `${this.apiUrl}/Projects/${id}/photo`,
      formData,
      { headers: this.getAuthHeaders() },
    );
  }

  // ==========================================
  // EXPERIENCE
  // ==========================================
  getExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.apiUrl}/Experiences`).pipe(
      map(res => (res && res.length >= 3) ? res : CV_EXPERIENCES),
      catchError(() => of(CV_EXPERIENCES))
    );
  }

  createExperience(experience: Experience): Observable<Experience> {
    return this.http.post<Experience>(
      `${this.apiUrl}/Experiences`,
      experience,
      { headers: this.getAuthHeaders() },
    );
  }

  updateExperience(id: number, experience: Experience): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Experiences/${id}`, experience, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteExperience(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Experiences/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // EDUCATION
  // ==========================================
  getEducations(): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.apiUrl}/Education`).pipe(
      map(res => (res && res.length > 0) ? res : CV_EDUCATIONS),
      catchError(() => of(CV_EDUCATIONS))
    );
  }

  createEducation(education: Education): Observable<Education> {
    return this.http.post<Education>(`${this.apiUrl}/Education`, education, {
      headers: this.getAuthHeaders(),
    });
  }

  updateEducation(id: number, education: Education): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Education/${id}`, education, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteEducation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Education/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // SKILLS
  // ==========================================
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/Skills`).pipe(
      map(res => (res && res.length >= 6) ? res : CV_SKILLS),
      catchError(() => of(CV_SKILLS))
    );
  }

  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${this.apiUrl}/Skills`, skill, {
      headers: this.getAuthHeaders(),
    });
  }

  updateSkill(id: number, skill: Skill): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Skills/${id}`, skill, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Skills/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
