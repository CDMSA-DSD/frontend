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

export interface Comment {
    id: number
    content: string
    authorId: number
    author: string
    createdAt: string
    updatedAt: string | null
    replies: Comment[]
}

export interface Notification {
  id: number;
  message: string;
  createdAt: string;   
  read: boolean;
  targetUrl: string;   
}

