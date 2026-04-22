import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // UPDATED: Pointing to your LIVE Render API
  private apiUrl = 'https://portfolioapi-5yq3.onrender.com/api';

  // Helper method to attach the JWT token to requests that need [Authorize]
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
    return this.http.get<Profile>(`${this.apiUrl}/Profile`);
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
    return this.http.get<Project[]>(`${this.apiUrl}/Projects`);
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
    return this.http.get<Experience[]>(`${this.apiUrl}/Experiences`);
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
    return this.http.get<Education[]>(`${this.apiUrl}/Education`);
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
    return this.http.get<Skill[]>(`${this.apiUrl}/Skills`);
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
