export type HttpClient = {
  get: <T = unknown>(url: string) => Promise<T>;
  post: <T = unknown>(url: string, data: any) => Promise<T>;
};
