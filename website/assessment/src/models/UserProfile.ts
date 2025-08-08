export interface UserProfile {
  id: string;
  email?: string;
  
  // Demographics
  demographics: {
    ageRange?: string;
    geographicRegion?: string;
    culturalContext?: string[];
    languages?: string[];
  };
  
  // Professional information
  professional: {
    industry?: string;
    roleLevel?: string;
    organizationSize?: string;
    decisionAuthority?: number; // 1-10 scale
    yearsExperience?: number;
  };
  
  // Preferences
  preferences: {
    assessmentModality?: string[];
    learningStyle?: string;
    communicationPreference?: string;
    timezone?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileModel {
  constructor(private data: UserProfile) {}

  static create(profileData: Partial<UserProfile>): UserProfile {
    const now = new Date();
    return {
      id: profileData.id || '',
      email: profileData.email,
      demographics: {
        ageRange: profileData.demographics?.ageRange,
        geographicRegion: profileData.demographics?.geographicRegion,
        culturalContext: profileData.demographics?.culturalContext || [],
        languages: profileData.demographics?.languages || [],
      },
      professional: {
        industry: profileData.professional?.industry,
        roleLevel: profileData.professional?.roleLevel,
        organizationSize: profileData.professional?.organizationSize,
        decisionAuthority: profileData.professional?.decisionAuthority,
        yearsExperience: profileData.professional?.yearsExperience,
      },
      preferences: {
        assessmentModality: profileData.preferences?.assessmentModality || [],
        learningStyle: profileData.preferences?.learningStyle,
        communicationPreference: profileData.preferences?.communicationPreference,
        timezone: profileData.preferences?.timezone,
      },
      createdAt: profileData.createdAt || now,
      updatedAt: profileData.updatedAt || now,
    };
  }

  getId(): string {
    return this.data.id;
  }

  getIndustry(): string | undefined {
    return this.data.professional.industry;
  }

  getCulturalContext(): string[] {
    return this.data.demographics.culturalContext || [];
  }

  getDecisionAuthority(): number {
    return this.data.professional.decisionAuthority || 1;
  }

  getPreferredAssessmentModalities(): string[] {
    return this.data.preferences.assessmentModality || [];
  }

  update(updates: Partial<UserProfile>): UserProfile {
    return {
      ...this.data,
      ...updates,
      updatedAt: new Date(),
    };
  }

  toJSON(): UserProfile {
    return { ...this.data };
  }
}