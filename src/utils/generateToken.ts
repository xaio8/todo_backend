import jwt from "jsonwebtoken";

interface User {
  id: string | number;
  role: string | null;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const generateAccessToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "1h" },
  );
};

export const generateToken = async (user: User): Promise<TokenResponse> => {
  const accessToken = generateAccessToken(user);

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "15d" },
  );
  return { accessToken, refreshToken };
};
