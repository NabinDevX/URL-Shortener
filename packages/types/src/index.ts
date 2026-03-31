export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  limit?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  _id: string;
  email: string;
  name: string;
  authProvider?: string;
  avatar?: string;
  apiKey?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ShortURL {
  id: string;
  shortId: string;
  redirectUrl: string;
  totalClicks: number;
  createdAt: string;
}

export * from "./routes";
