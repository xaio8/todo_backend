import type { Server } from "socket.io";

let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

// emit to every socket joined in user:{id} room - no-op when io not ready
export const emitToUser = (
  userId: string,
  event: string,
  payload: unknown,
): void => {
  io?.to(`user:${userId}`).emit(event, payload);
};
