export interface StateStore<T> {
  get(): Promise<T | null>;
  set(state: T): Promise<void>;
  merge(partial: Partial<T>): Promise<void>;
  shutdown(): Promise<void>;
}
