import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateToken } from "../utils/generateToken.js";
import { SafeUser } from "../types/index.js";
import z from "zod";
import { ZodError } from "zod/v3";
import { setRefreshTokenCookies } from "../utils/cookiesHelper.js";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
// import { sendVerificationEmail } from "../utils/mailHelper.js";

const loginSchema = z.object({
  email: z.email("Invalid email format").trim(),
  password: z
    .string()
    .min(6, " password must be at least 6 characters")
    .max(100, "password is too long"),
});

const signUpSchema = z
  .object({
    name: z.string().max(50),
    email: z.email("Please enter a valid email address").trim(),
    password: z
      .string()
      .min(6, " password must be at least 6 characters")
      .max(100, "password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    if (!email || !password) {
      return next(new AppError("Please fill all required fields", 400));
    }

    //find user in database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email as string));

    if (!user) {
      return next(new AppError("Invalid Credentials", 401));
    }

    //todo comment out after fix email service
    // if (!user.isVerified) {
    //   return next(new AppError("Please verify your email first", 403));
    // }

    // match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        con: false,
        message: "Invalid Credentials",
      });
    }

    // generate token
    const { accessToken, refreshToken } = await generateToken({
      id: user.id,
      role: user.role,
    });

    await db
      .update(users)
      .set({ refreshToken: refreshToken })
      .where(eq(users.id, user.id));

    setRefreshTokenCookies(res, refreshToken);

    return res.status(200).json({
      con: true,
      message: "Login Successful",
      accessToken,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } as SafeUser,
    });
  } catch (error) {
    next(error);
  }
};

// signup user
export const signUpUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password, confirmPassword } = signUpSchema.parse(
      req.body,
    );

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({
        con: false,
        message: "Email already exits",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // const verifyToken = crypto.randomUUID().toString();
    // const verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); //! 1Hour

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        // verifyToken,
        // verifyTokenExpiry,
        isVerified: true, //todo change false after fix
      })
      .returning();

    // const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;

    // // ✉️ send email
    // await sendVerificationEmail(email, verifyLink);

    // return res.status(201).json({
    //   con: true,
    //   message: "Signup successful. Please verify your email.",
    // });

    const { accessToken, refreshToken } = await generateToken({
      id: newUser.id,
      role: newUser.role,
    });

    await db
      .update(users)
      .set({ refreshToken: refreshToken })
      .where(eq(users.id, newUser.id));

    setRefreshTokenCookies(res, refreshToken);

    const {
      password: _,
      refreshToken: __,
      ...userWithoutSensitiveData
    } = newUser;
    return res.status(201).json({
      con: true,
      message: "Account create successfully",
      data: {
        user: userWithoutSensitiveData,
        token: accessToken,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        con: false,
        message: "validation failed",
        error: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

// verify email
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.query;

    if (!token) {
      return next(new AppError("Invalid token", 400));
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verifyToken, token as string));

    if (!user) {
      return next(new AppError("Invalid or expired token", 400));
    }

    if (user.verifyTokenExpiry! < new Date()) {
      return next(new AppError("Token expired", 400));
    }

    await db
      .update(users)
      .set({
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    return res.status(200).json({
      con: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

//logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await db
        .update(users)
        .set({ refreshToken: null })
        .where(eq(users.refreshToken, refreshToken));
    }

    res.clearCookie("refreshToken");
    res.status(200).json({
      con: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(error);
  }
};

// refresh access token
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // token from cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        con: false,
        message: "Refresh token out found",
      });
    }

    // check token is valid on table
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.refreshToken, refreshToken));
    if (!user) {
      return res.status(400).json({
        con: false,
        message: "Invalid refresh token",
      });
    }

    // verify token
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
      (err: any, decoded: any) => {
        if (err || decoded.userId !== user.id.toString()) {
          return res.status(403).json({
            con: false,
            message: "Token expired or invalid",
          });
        }
      },
    );

    // generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });
    res.status(200).json({
      con: true,
      message: "Token refreshed successfully",
      data: {
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
