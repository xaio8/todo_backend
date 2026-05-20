class OnlineUsersService {
  private static connections = new Map<string, Set<string>>();

  static addConnection(userId: string, socketId: string): boolean {
    const sockets = this.connections.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    this.connections.set(userId, sockets);
    return wasOffline;
  }

  static removeConnection(userId: string, socketId: string): boolean {
    const sockets = this.connections.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.connections.delete(userId);
      return true;
    }
    return false;
  }

  static isOnline(userId: string): boolean {
    return (this.connections.get(userId)?.size ?? 0) > 0;
  }

  static getOnlineUserIds(): string[] {
    return [...this.connections.keys()];
  }

  static getOnlineFromList(userIds: string[]): string[] {
    return userIds.filter((id) => this.isOnline(id));
  }
}

export default OnlineUsersService;
