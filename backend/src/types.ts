import { Role } from "@prisma/client";

export type AuthUser = {
  id: number;
  role: Role;
  username: string;
  fullName: string;
};
