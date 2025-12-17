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
    authorName: string
    createdAt: string
    updatedAt: string | null
    replies: Comment[]
}

export type NotificationType =
  | "MENTION"
  | "RFC_UPDATE"
  | "APP_NOTIFICATION"
  | "OTHER"

export interface Notification {
  id: number
  type: NotificationType
  message: string
  details: string | null
  createdAt: string
  read: boolean
  commentId: number | null
  rfcId: number | null
}

// OJO: en backend el campo `read` es en realidad
// `areThereNotReadNotis(...)` => "hay no leídas"
export interface NotificationStatus {
  read: boolean
  notisNotRead: number
}

