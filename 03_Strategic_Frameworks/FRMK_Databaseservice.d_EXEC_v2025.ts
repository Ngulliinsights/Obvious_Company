---
title: "Databaseservice.d"
type: "framework"
audience: "executives"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { Pool } from 'pg';
import { UserProfile } from '../models/UserProfile';
import { AssessmentSession } from '../models/AssessmentSession';
export declare class DatabaseService {
    private pool;
    constructor(pool: Pool);
    createUserProfile(profile: UserProfile): Promise<UserProfile>;
    getUserProfile(id: string): Promise<UserProfile | null>;
    updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
    createAssessmentSession(session: AssessmentSession): Promise<AssessmentSession>;
    getAssessmentSession(id: string): Promise<AssessmentSession | null>;
    updateAssessmentSession(id: string, updates: Partial<AssessmentSession>): Promise<AssessmentSession | null>;
    private mapRowToUserProfile;
    private mapRowToAssessmentSession;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=DatabaseService.d.ts.map