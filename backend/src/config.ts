import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret_only_for_local",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
};
