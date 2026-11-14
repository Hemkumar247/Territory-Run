import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export class FirestoreOperationError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FirestoreOperationError';
    this.code = code;
  }
}

/**
 * Logs the failure (no email / profile data) and throws a short, user-safe error.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const code = (error as { code?: string })?.code;
  console.error('Firestore Error:', {
    operationType,
    path,
    code,
    error: error instanceof Error ? error.message : String(error),
    userId: auth.currentUser?.uid,
  });
  throw new FirestoreOperationError(
    code === 'permission-denied'
      ? 'You do not have permission to do that.'
      : code === 'unavailable'
        ? 'Network error. Check your connection and try again.'
        : 'Could not complete the request. Please try again.',
    code
  );
}
