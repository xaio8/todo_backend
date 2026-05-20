import jwt from "jsonwebtoken";
import { Socket } from "socket.io";

interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    role: "user" | "admin";
  };
}

export const authenticateSocket = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const authHeader = socket.handshake.auth?.token as string | undefined;
    const headerToken = socket.handshake.headers.authorization;
    const token =
      authHeader ??
      (headerToken?.startsWith("Bearer ")
        ? headerToken.split(" ")[1]
        : headerToken);

    if (!token) {
      return next(new Error("Unauthorized: token missing"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    (socket as AuthenticatedSocket).user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    next(new Error("Unauthorized: invalid token"));
  }
};
