import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import {
  PortfolioService,
  Project,
  Experience,
  Education,
  Skill,
  Profile,
} from '../../services/portfolio';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private portfolioService = inject(PortfolioService);
  private router = inject(Router);

  activeTab = signal<
    'profile' | 'projects' | 'experience' | 'education' | 'skills'
  >('profile');

  // Signals to hold all your database data
  profile = signal<Profile | null>(null);
  projects = signal<Project[]>([]);
  experiences = signal<Experience[]>([]);
  educations = signal<Education[]>([]);
  skills = signal<Skill[]>([]);

  // Profile UI State
  selectedCvFile: File | null = null;
  isSaving: boolean = false;

  // Project UI State
  showProjectModal: boolean = false;
  isEditingProject: boolean = false;
  currentProject: any = {};
  selectedProjectImage: File | null = null;
  isProjectSaving: boolean = false;

  // NEW: Experience UI State
  showExperienceModal: boolean = false;
  isEditingExperience: boolean = false;
  currentExperience: any = {};
  isExperienceSaving: boolean = false;

  // NEW: Education UI State
  showEducationModal: boolean = false;
  isEditingEducation: boolean = false;
  currentEducation: any = {};
  isEducationSaving: boolean = false;

  // NEW: Skills UI State
  showSkillModal: boolean = false;
  isEditingSkill: boolean = false;
  currentSkill: any = {};
  isSkillSaving: boolean = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.portfolioService
      .getProfile()
      .subscribe({ next: (data) => this.profile.set(data) });
    this.portfolioService
      .getProjects()
      .subscribe({ next: (data) => this.projects.set(data) });
    this.portfolioService
      .getExperiences()
      .subscribe({ next: (data) => this.experiences.set(data) });
    this.portfolioService
      .getEducations()
      .subscribe({ next: (data) => this.educations.set(data) });
    this.portfolioService
      .getSkills()
      .subscribe({ next: (data) => this.skills.set(data) });
  }

  switchTab(
    tab: 'profile' | 'projects' | 'experience' | 'education' | 'skills',
  ): void {
    this.activeTab.set(tab);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ==========================================
  // PROFILE TAB METHODS
  // ==========================================
  onCvSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) this.selectedCvFile = file;
  }

  saveProfile(): void {
    const currentProfile = this.profile();
    if (!currentProfile) return;

    this.isSaving = true;

    if (this.selectedCvFile) {
      this.portfolioService.uploadCv(this.selectedCvFile).subscribe({
        next: (response) => {
          currentProfile.cvUrl = response.cvUrl;
          this.updateDatabaseProfile(currentProfile);
        },
        error: (err) => {
          console.error('CV upload failed', err);
          alert('Failed to upload CV to Cloudinary.');
          this.isSaving = false;
        },
      });
    } else {
      this.updateDatabaseProfile(currentProfile);
    }
  }

  private updateDatabaseProfile(profileData: Profile): void {
    this.portfolioService.updateProfile(profileData).subscribe({
      next: () => {
        this.selectedCvFile = null;
        this.isSaving = false;
        alert('Profile and CV successfully updated!');
      },
      error: (err) => {
        console.error('Update failed', err);
        alert('Failed to save profile data.');
        this.isSaving = false;
      },
    });
  }

  // ==========================================
  // PROJECTS TAB METHODS
  // ==========================================
  openProjectModal(project?: Project): void {
    if (project) {
      this.isEditingProject = true;
      this.currentProject = { ...project };
      this.currentProject.techStackString = project.techStack
        ? project.techStack.join(', ')
        : '';
    } else {
      this.isEditingProject = false;
      this.currentProject = {
        title: '',
        description: '',
        liveUrl: '',
        gitHubUrl: '',
        techStackString: '',
      };
    }
    this.selectedProjectImage = null;
    this.showProjectModal = true;
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
  }

  onProjectImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) this.selectedProjectImage = file;
  }

  saveProject(): void {
    this.isProjectSaving = true;
    const techArray = this.currentProject.techStackString
      ? this.currentProject.techStackString
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '')
      : [];

    // FIX: Using || null prevents empty strings ("") from causing a 400 Bad Request on the backend
    const projectData: Project = {
      id: this.currentProject.id || 0,
      title: this.currentProject.title,
      description: this.currentProject.description,
      liveUrl: this.currentProject.liveUrl || null,
      gitHubUrl: this.currentProject.gitHubUrl || null,
      techStack: techArray,
      imageUrl: this.currentProject.imageUrl || null,
    };

    if (this.isEditingProject) {
      this.portfolioService
        .updateProject(projectData.id, projectData)
        .subscribe({
          next: () => {
            if (this.selectedProjectImage)
              this.uploadProjectImage(projectData.id);
            else this.finishProjectSave();
          },
          error: (err) => {
            console.error('Failed to update project', err);
            alert(
              'Failed to update project. Please check backend compatibility.',
            );
            this.isProjectSaving = false;
          },
        });
    } else {
      this.portfolioService.createProject(projectData).subscribe({
        next: (createdProject) => {
          if (this.selectedProjectImage)
            this.uploadProjectImage(createdProject.id);
          else this.finishProjectSave();
        },
        error: (err) => {
          console.error('Failed to create project', err);
          alert('Failed to create project.');
          this.isProjectSaving = false;
        },
      });
    }
  }

  private uploadProjectImage(projectId: number): void {
    if (!this.selectedProjectImage) return;
    this.portfolioService
      .uploadProjectPhoto(projectId, this.selectedProjectImage)
      .subscribe({
        next: () => this.finishProjectSave(),
        error: (err) => {
          console.error('Failed to upload project image', err);
          alert('Project text saved, but image upload failed.');
          this.finishProjectSave();
        },
      });
  }

  private finishProjectSave(): void {
    this.isProjectSaving = false;
    this.showProjectModal = false;
    this.portfolioService
      .getProjects()
      .subscribe((data) => this.projects.set(data));
  }

  deleteProject(id: number): void {
    if (
      confirm(
        'Are you sure you want to delete this project? This cannot be undone.',
      )
    ) {
      this.portfolioService.deleteProject(id).subscribe({
        next: () =>
          this.portfolioService
            .getProjects()
            .subscribe((data) => this.projects.set(data)),
        error: (err) => alert('Failed to delete project.'),
      });
    }
  }

  // ==========================================
  // EXPERIENCE TAB METHODS
  // ==========================================
  openExperienceModal(exp?: Experience): void {
    if (exp) {
      this.isEditingExperience = true;
      this.currentExperience = { ...exp };
      // Join array with newlines for the textarea
      this.currentExperience.responsibilitiesString = exp.responsibilities
        ? exp.responsibilities.join('\n')
        : '';
    } else {
      this.isEditingExperience = false;
      this.currentExperience = {
        jobTitle: '',
        companyName: '',
        employmentType: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentRole: false,
        responsibilitiesString: '',
      };
    }
    this.showExperienceModal = true;
  }

  closeExperienceModal(): void {
    this.showExperienceModal = false;
  }

  saveExperience(): void {
    this.isExperienceSaving = true;
    // Split by newline to create the array
    const respArray = this.currentExperience.responsibilitiesString
      ? this.currentExperience.responsibilitiesString
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '')
      : [];

    const expData: Experience = {
      id: this.currentExperience.id || 0,
      jobTitle: this.currentExperience.jobTitle,
      companyName: this.currentExperience.companyName,
      employmentType: this.currentExperience.employmentType,
      location: this.currentExperience.location,
      startDate: this.currentExperience.startDate,
      endDate: this.currentExperience.isCurrentRole
        ? ''
        : this.currentExperience.endDate,
      isCurrentRole: this.currentExperience.isCurrentRole,
      responsibilities: respArray,
    };

    if (this.isEditingExperience) {
      this.portfolioService.updateExperience(expData.id, expData).subscribe({
        next: () => {
          this.isExperienceSaving = false;
          this.showExperienceModal = false;
          this.portfolioService
            .getExperiences()
            .subscribe((data) => this.experiences.set(data));
        },
        error: (err) => {
          alert('Failed to update experience.');
          this.isExperienceSaving = false;
        },
      });
    } else {
      this.portfolioService.createExperience(expData).subscribe({
        next: () => {
          this.isExperienceSaving = false;
          this.showExperienceModal = false;
          this.portfolioService
            .getExperiences()
            .subscribe((data) => this.experiences.set(data));
        },
        error: (err) => {
          alert('Failed to create experience.');
          this.isExperienceSaving = false;
        },
      });
    }
  }

  deleteExperience(id: number): void {
    if (confirm('Delete this experience record?')) {
      this.portfolioService.deleteExperience(id).subscribe({
        next: () =>
          this.portfolioService
            .getExperiences()
            .subscribe((data) => this.experiences.set(data)),
        error: (err) => alert('Failed to delete experience.'),
      });
    }
  }

  // ==========================================
  // EDUCATION TAB METHODS
  // ==========================================
  openEducationModal(edu?: Education): void {
    if (edu) {
      this.isEditingEducation = true;
      this.currentEducation = { ...edu };
    } else {
      this.isEditingEducation = false;
      this.currentEducation = {
        degree: '',
        institution: '',
        location: '',
        startYear: '',
        endYear: '',
      };
    }
    this.showEducationModal = true;
  }

  closeEducationModal(): void {
    this.showEducationModal = false;
  }

  saveEducation(): void {
    this.isEducationSaving = true;
    const eduData: Education = {
      id: this.currentEducation.id || 0,
      degree: this.currentEducation.degree,
      institution: this.currentEducation.institution,
      location: this.currentEducation.location,
      startYear: this.currentEducation.startYear,
      endYear: this.currentEducation.endYear,
    };

    if (this.isEditingEducation) {
      this.portfolioService.updateEducation(eduData.id, eduData).subscribe({
        next: () => {
          this.isEducationSaving = false;
          this.showEducationModal = false;
          this.portfolioService
            .getEducations()
            .subscribe((data) => this.educations.set(data));
        },
        error: (err) => {
          alert('Failed to update education.');
          this.isEducationSaving = false;
        },
      });
    } else {
      this.portfolioService.createEducation(eduData).subscribe({
        next: () => {
          this.isEducationSaving = false;
          this.showEducationModal = false;
          this.portfolioService
            .getEducations()
            .subscribe((data) => this.educations.set(data));
        },
        error: (err) => {
          alert('Failed to create education.');
          this.isEducationSaving = false;
        },
      });
    }
  }

  deleteEducation(id: number): void {
    if (confirm('Delete this education record?')) {
      this.portfolioService.deleteEducation(id).subscribe({
        next: () =>
          this.portfolioService
            .getEducations()
            .subscribe((data) => this.educations.set(data)),
        error: (err) => alert('Failed to delete education.'),
      });
    }
  }

  // ==========================================
  // SKILLS TAB METHODS
  // ==========================================
  openSkillModal(skill?: Skill): void {
    if (skill) {
      this.isEditingSkill = true;
      this.currentSkill = { ...skill };
      this.currentSkill.itemsString = skill.items ? skill.items.join(', ') : '';
    } else {
      this.isEditingSkill = false;
      // Default to primary color if adding a new one
      this.currentSkill = {
        title: '',
        icon: 'fas fa-star',
        accentColorVar: 'var(--color-brand-primary)',
        itemsString: '',
      };
    }
    this.showSkillModal = true;
  }

  closeSkillModal(): void {
    this.showSkillModal = false;
  }

  saveSkill(): void {
    this.isSkillSaving = true;
    const itemsArray = this.currentSkill.itemsString
      ? this.currentSkill.itemsString
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '')
      : [];

    const skillData: Skill = {
      id: this.currentSkill.id || 0,
      title: this.currentSkill.title,
      icon: this.currentSkill.icon,
      accentColorVar: this.currentSkill.accentColorVar,
      items: itemsArray,
    };

    if (this.isEditingSkill) {
      this.portfolioService.updateSkill(skillData.id, skillData).subscribe({
        next: () => {
          this.isSkillSaving = false;
          this.showSkillModal = false;
          this.portfolioService
            .getSkills()
            .subscribe((data) => this.skills.set(data));
        },
        error: (err) => {
          alert('Failed to update skill.');
          this.isSkillSaving = false;
        },
      });
    } else {
      this.portfolioService.createSkill(skillData).subscribe({
        next: () => {
          this.isSkillSaving = false;
          this.showSkillModal = false;
          this.portfolioService
            .getSkills()
            .subscribe((data) => this.skills.set(data));
        },
        error: (err) => {
          alert('Failed to create skill.');
          this.isSkillSaving = false;
        },
      });
    }
  }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill category?')) {
      this.portfolioService.deleteSkill(id).subscribe({
        next: () =>
          this.portfolioService
            .getSkills()
            .subscribe((data) => this.skills.set(data)),
        error: (err) => alert('Failed to delete skill.'),
      });
    }
  }
}
