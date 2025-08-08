// Shared filter types for property listings
// This file defines the base filter interfaces and property-specific extensions

export interface BasePropertyFilters {
  query: string;
  location: string;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  sortBy: 'price' | 'date' | 'relevance' | 'rating' | 'roi' | 'size';
  sortOrder: 'asc' | 'desc';
}

export interface CommercialFilters extends BasePropertyFilters {
  propertyType: 'office' | 'retail' | 'warehouse' | 'industrial' | 'mixed-use' | '';
  sizeMin: number | null;
  sizeMax: number | null;
  roiMin: number | null;
  occupancyRate: number | null;
  parking: boolean;
}

export interface ResidentialFilters extends BasePropertyFilters {
  propertyType: 'apartment' | 'house' | 'villa' | 'townhouse' | 'penthouse' | 'duplex' | 'studio' | '';
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean | null;
  parking: boolean;
  petFriendly: boolean | null;
}

export interface LandFilters extends BasePropertyFilters {
  landType: 'agricultural' | 'residential' | 'commercial' | 'industrial' | '';
  sizeMin: number | null;
  sizeMax: number | null;
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'flagged' | '';
  trustScoreMin: number | null;
  titleDeedStatus: 'available' | 'pending' | 'missing' | '';
  riskLevel: 'low' | 'medium' | 'high' | '';
}

export interface AllPropertiesFilters extends BasePropertyFilters {
  propertyCategory: 'residential' | 'commercial' | 'land' | '';
  bedrooms: number | null;
  bathrooms: number | null;
}

// Filter field configuration for dynamic form generation
export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'range' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

// Quick filter configuration for filter pills
export interface QuickFilter {
  key: string;
  label: string;
  options: Array<{ 
    value: string; 
    label: string; 
    icon?: React.ComponentType<{ className?: string }>;
    count?: string;
  }>;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Sort option types
export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'views' | 'roi-desc' | 'size-desc';
export type ViewMode = 'grid' | 'list';

// Filter state options
export interface FilterStateOptions<T> {
  defaultFilters: T;
  debounceMs?: number;
  onChange?: (filters: T) => void;
  syncWithUrl?: boolean;
  validateOnChange?: boolean;
}

// Filter state return type
export interface FilterStateReturn<T> {
  filters: T;
  setFilters: (filters: T | ((prev: T) => T)) => void;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  reset: () => void;
  debouncedFilters: T;
  isValid: boolean;
  errors: Record<string, string>;
  hasActiveFilters: boolean;
  clearFilter: (key: keyof T) => void;
}

