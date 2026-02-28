import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { config } from "../config.js";
import { AuthUser } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type AuthTokenPayload = {
  sub: number;
  role: Role;
  username: string;
  fullName: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "未登录或令牌缺失" });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, config.jwtSecret) as unknown as AuthTokenPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
      fullName: payload.fullName
    };
    next();
  } catch {
    res.status(401).json({ message: "令牌无效或已过期" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "请先登录" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "没有权限访问此资源" });
      return;
    }
    next();
  };
}
