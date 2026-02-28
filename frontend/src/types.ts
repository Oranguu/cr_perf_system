export type Role = "admin" | "manager" | "employee";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: Role;
  };
}

export interface Dimension {
  id: number;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  employee?: {
    employeeNo: string;
    department: string;
    title: string;
  };
}
