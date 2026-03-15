export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  createdAt: string;
  updatedAt?: string;
  isVerified?: boolean;
}

export type UserData = User;

export interface VisitHistory {
  _id?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface UrlItem {
  _id: string;
  shortId: string;
  redirectUrl: string;
  totalClicks: number;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  visitHistory?: VisitHistory[];
  qrCode?: string;
  userId?: string;
}

export interface UrlAnalytics {
  shortId?: string;
  totalClicks: number;
  clicksByDate?: Array<{ date: string; count: number }>;
  topReferrers?: Array<{ referer: string; count: number }>;
  topCountries?: Array<{ country: string; count: number }>;
  topDevices?: Array<{ device: string; count: number }>;
}

export interface CreateUrlPayload {
  url: string;
  customShortId?: string;
  idLength?: number;
}

export interface NewUrlForm {
  url: string;
  customShortId: string;
  idLength: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UrlsApiResponse {
  urls: UrlItem[];
  total?: number;
}

export interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: { message?: string; data?: unknown };
  };
  request?: unknown;
  message?: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface SignupFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
  general?: string;
  success?: string;
}

export interface ProfileFormErrors {
  name?: string;
  email?: string;
  otp?: string;
  general?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateAccountForm {
  name: string;
  email: string;
  otp: string;
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type MessageType = "success" | "error" | "warning" | "info" | "";

export interface Message {
  text: string;
  type: MessageType;
}

export interface DashboardProps {
  userData: User | null;
}

export interface NavbarProps {
  userData: User | null;
}

export interface ProfileProps {
  userData?: User | null;
}

export interface AnalyticsMap {
  [shortId: string]: UrlAnalytics;
}

export interface LoadingMap {
  [shortId: string]: boolean;
}

export interface GeneratingQRMap {
  [shortId: string]: boolean;
}

export type FormEvent = React.FormEvent<HTMLFormElement>;
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type KeyboardEvent = React.KeyboardEvent<HTMLInputElement>;
export type ClipboardEvent = React.ClipboardEvent<HTMLInputElement>;
