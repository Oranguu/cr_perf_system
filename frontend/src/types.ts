export type Role = "admin" | "manager" | "employee";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: Role;
    avatarUrl?: string;
  };
}

export interface Dimension {
  id: number;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
  score5Desc: string;
  score4Desc: string;
  score3Desc: string;
  score2Desc: string;
  score1Desc: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  employee?: {
    employeeNo: string;
    department: string;
    title: string;
  };
}
