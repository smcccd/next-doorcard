// Basic Info Form
export interface BasicInfoFormProps {
  sessionName?: string | null | undefined;
}

// Campus Term Selector
export interface FormTerm {
  id: string;
  name: string;
  year: string;
  season: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isArchived?: boolean;
  isUpcoming?: boolean;
}

// Resume Doorcard
export interface ResumeDoorcard {
  id: string;
  name: string;
  lastUpdated: string;
  completionPercentage: number;
}

export interface ResumeDoorCardProps {
  draft: ResumeDoorcard;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}
