export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface RfcResponse {
  id: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdrResponse {
  id: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}
