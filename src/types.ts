export interface Account {
  id: string;
  email: string;
  link?: string;
  targetDate: string;
  reminder10MinSent: boolean;
  readySent: boolean;
  createdAt?: string;
}
