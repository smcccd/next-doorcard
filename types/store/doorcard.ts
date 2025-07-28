import type {
  TimeBlockForm,
  BasicInfoForm,
} from "@/lib/validations/doorcard-edit";

export type DoorcardMode = "create" | "edit" | "view";

/**
 * Zustand store state for the doorcard editor.
 * This is *client-side only* and not persisted directly.
 */
export interface DoorcardEditorState {
  // Mode tracking / identity
  mode: DoorcardMode;
  originalDoorcardId: string | null;
  draftId: string | null;

  // Form data (mirrors DoorcardForm shape)
  name: string;
  doorcardName: string;
  officeNumber: string;
  term: string;
  year: string;
  college: string;
  timeBlocks: TimeBlockForm[];

  currentStep: number;
  errors: {
    basicInfo?: Record<string, string>;
    timeBlocks?: string[];
    general?: string[];
  };

  // UI flags
  hasViewedPreview: boolean;
  hasViewedPrint: boolean;

  // Loading flags
  isLoading: {
    loadingDraft: boolean;
    loadingDoorcard: boolean;
    savingDraft: boolean;
    submitting: boolean;
    deleting: boolean;
  };

  /* ===== Actions (methods injected by createStore) ===== */
  setMode: (mode: DoorcardMode, doorcardId?: string) => void;
  setBasicInfo: (
    info: Partial<BasicInfoForm>,
    options?: { skipAutoSave?: boolean },
  ) => void;
  setTimeBlocks: (
    timeBlocks: TimeBlockForm[],
    options?: { skipAutoSave?: boolean },
  ) => void;
  addTimeBlock: (timeBlock: TimeBlockForm) => void;
  removeTimeBlock: (id: string) => void;
  setCurrentStep: (step: number) => void;
  validateCurrentStep: () => Promise<boolean>;
  validateDuplicateDoorcards: () => Promise<{
    isDuplicate: boolean;
    message: string;
    existingDoorcardId?: string;
  }>;
  reset: () => void;
  loadDraft: (draftId: string) => Promise<void>;
  calculateProgress: () => number;
  saveDraft: () => Promise<void>;
  autoSaveDraft: () => void;
  saveAndReturnToDashboard: () => Promise<void>;
  setStepViewed: (step: "preview" | "print") => void;
  saveEntireState: () => Promise<void>;
  loadDoorcard: (doorcardId: string) => Promise<void>;
  shouldAutoSave: () => boolean;
  setLoading: (
    key: keyof DoorcardEditorState["isLoading"],
    value: boolean,
  ) => void;
}

/**
 * Simple shape returned by a progress helper.
 */
export interface StepProgress {
  totalPoints: number;
  completedPoints: number;
}
