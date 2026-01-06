// =====================================================
// ERROR TYPES
// =====================================================

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export class WorkspaceNotFoundError extends Error {
  constructor(slug: string) {
    super(`Workspace with slug "${slug}" not found`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(slug: string) {
    super(`Project with slug "${slug}" not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class InsufficientPermissionsError extends Error {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
    this.name = 'InsufficientPermissionsError';
  }
}

