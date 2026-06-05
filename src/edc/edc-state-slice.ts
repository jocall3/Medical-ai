export interface CRFPageState {
  currentPageIndex: number;
  pages: {
    title: string;
    fields: string[];
  }[];
  formData: Record<string, any>;
  initialFormData: Record<string, any>;
  validationErrors: Record<string, string>;
  validationWarnings: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  activeQueries: Record<string, { queryId: string; text: string; status: string }>;
}

export class EDCStateSlice {
  private state: CRFPageState;

  constructor(pages: { title: string; fields: string[] }[], initialData: Record<string, any> = {}) {
    this.state = {
      currentPageIndex: 0,
      pages,
      formData: { ...initialData },
      initialFormData: { ...initialData },
      validationErrors: {},
      validationWarnings: {},
      isDirty: false,
      isSubmitting: false,
      activeQueries: {},
    };
  }

  public getState(): CRFPageState {
    return { ...this.state };
  }

  public updateField(fieldKey: string, value: any): void {
    this.state.formData[fieldKey] = value;
    this.state.isDirty = JSON.stringify(this.state.formData) !== JSON.stringify(this.state.initialFormData);
    delete this.state.validationErrors[fieldKey];
    delete this.state.validationWarnings[fieldKey];
  }

  public nextPage(): boolean {
    if (this.state.currentPageIndex < this.state.pages.length - 1) {
      this.state.currentPageIndex++;
      return true;
    }
    return false;
  }

  public prevPage(): boolean {
    if (this.state.currentPageIndex > 0) {
      this.state.currentPageIndex--;
      return true;
    }
    return false;
  }

  public setValidationResults(errors: Record<string, string>, warnings: Record<string, string>): void {
    this.state.validationErrors = errors;
    this.state.validationWarnings = warnings;
  }

  public setSubmitting(isSubmitting: boolean): void {
    this.state.isSubmitting = isSubmitting;
  }

  public resetForm(): void {
    this.state.formData = { ...this.state.initialFormData };
    this.state.validationErrors = {};
    this.state.validationWarnings = {};
    this.state.isDirty = false;
  }

  public saveSuccess(savedData: Record<string, any>): void {
    this.state.initialFormData = { ...savedData };
    this.state.formData = { ...savedData };
    this.state.isDirty = false;
  }

  public setActiveQueries(queries: Record<string, { queryId: string; text: string; status: string }>): void {
    this.state.activeQueries = queries;
  }
}