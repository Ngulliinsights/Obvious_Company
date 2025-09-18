---
title: "Userprofile"
type: "framework"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileModel = void 0;
class UserProfileModel {
    constructor(data) {
        this.data = data;
    }
    static create(profileData) {
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
    getId() {
        return this.data.id;
    }
    getIndustry() {
        return this.data.professional.industry;
    }
    getCulturalContext() {
        return this.data.demographics.culturalContext || [];
    }
    getDecisionAuthority() {
        return this.data.professional.decisionAuthority || 1;
    }
    getPreferredAssessmentModalities() {
        return this.data.preferences.assessmentModality || [];
    }
    update(updates) {
        return {
            ...this.data,
            ...updates,
            updatedAt: new Date(),
        };
    }
    toJSON() {
        return { ...this.data };
    }
}
exports.UserProfileModel = UserProfileModel;
//# sourceMappingURL=UserProfile.js.map