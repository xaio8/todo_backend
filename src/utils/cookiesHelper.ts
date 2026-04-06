import { Response } from "express";

export const setRefreshTokenCookies = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000, //15 days
  });
};
