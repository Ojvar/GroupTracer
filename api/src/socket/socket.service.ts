import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createServer, Server as HttpServer } from "node:http";
import type { Socket } from "socket.io";
import { Server } from "socket.io";
import { RoomService } from "../room/room.service";
import type {
  JoinRoomPayload,
  JoinRoomResponse,
  RoomMessagePayload,
  SocketConfig,
  UserLocationPayload,
} from "./socket.types";

type JoinRoomAck = (response: JoinRoomResponse) => void;

/**
 * SocketService manages the lifecycle of the Socket.IO server instance.
 */
@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketService.name);
  private readonly httpServer: HttpServer;
  private readonly config: SocketConfig;
  private readonly joinRoomEvent = "join-room";
  private readonly locationEvent = "user-location";
  private readonly messageEvent = "room-message";
  private socketServer?: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly roomService: RoomService
  ) {
    this.config = this.buildConfig();
    this.httpServer = createServer();
  }

  /**
   * getServer returns the active Socket.IO server instance.
   */
  public getServer(): Server {
    if (!this.socketServer) {
      throw new Error("Socket server is not initialized yet.");
    }
    return this.socketServer;
  }

  public onModuleInit(): void {
    if (this.socketServer) {
      return;
    }
    this.socketServer = this.createSocketServer();
  }

    /**
     * onModuleDestroy gracefully shuts down the socket resources.
     */
    public async onModuleDestroy(): Promise<void> {
      if (!this.socketServer) {
        this.httpServer.close();
        return;
      }
      this.socketServer.removeAllListeners();
      await this.socketServer.close();
      this.httpServer.close();
    }

    private createSocketServer(): Server {
      const server = new Server(this.httpServer, {
        path: this.config.path,
        cors: { origin: [...this.config.corsOrigins] },
      });
      server.on("connection", (socket) => {
        this.logger.log(`Socket connected: ${socket.id}`);
        socket.on("disconnect", (reason) => {
          this.logger.log(`Socket disconnected: ${socket.id} reason: ${reason}`);
        });
        socket.on(this.joinRoomEvent, (payload, callback) =>
          this.handleJoinRoom(socket, payload, callback)
        );
        socket.on(this.locationEvent, (payload) =>
          this.handleUserLocation(socket, payload)
        );
        socket.on(this.messageEvent, (payload) =>
          this.handleRoomMessage(socket, payload)
        );
      });
      this.httpServer.listen(this.config.port, () => {
        this.logger.log(`Socket.io server listening on port ${this.config.port}`);
      });
      return server;
    }

  private handleJoinRoom(
    socket: Socket,
    payload: JoinRoomPayload,
    callback?: JoinRoomAck
  ): void {
    const validationMessage = this.validateJoinPayload(payload);
    if (validationMessage) {
      return this.replyJoin(callback, {
        success: false,
        message: validationMessage,
      });
    }
    try {
      const room = this.roomService.ensureRoomAccess(
        payload.roomName,
        payload.password
      );
      const roomKey = this.roomService.normalizeRoomName(room.name);
      socket.join(roomKey);
      this.replyJoin(callback, { success: true });
      this.logger.log(`Socket ${socket.id} joined room ${room.name}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to join the requested room.";
      this.replyJoin(callback, { success: false, message });
      this.logger.warn(`Socket ${socket.id} failed to join room: ${message}`);
    }
  }

  private handleUserLocation(
    socket: Socket,
    payload: UserLocationPayload
  ): void {
    if (!this.isValidLocationPayload(payload)) {
      this.logger.warn(`Socket ${socket.id} sent invalid location payload.`);
      return;
    }
    const roomKey = this.roomService.normalizeRoomName(payload.roomName);
    if (!socket.rooms.has(roomKey)) {
      this.logger.warn(
        `Socket ${socket.id} attempted to emit to room ${payload.roomName} without joining.`
      );
      return;
    }
    socket.to(roomKey).emit(this.locationEvent, payload);
    if (typeof this.logger.debug === "function") {
      this.logger.debug(
        `Forwarded location from ${socket.id} to room ${payload.roomName}`
      );
    }
  }

  private handleRoomMessage(socket: Socket, payload: RoomMessagePayload): void {
    if (!this.isValidMessagePayload(payload)) {
      this.logger.warn(`Socket ${socket.id} sent invalid message payload.`);
      return;
    }
    const roomKey = this.roomService.normalizeRoomName(payload.roomName);
    if (!socket.rooms.has(roomKey)) {
      this.logger.warn(
        `Socket ${socket.id} attempted to message room ${payload.roomName} without joining.`
      );
      return;
    }
    if (!this.socketServer) {
      this.logger.error("Socket server is not available to forward messages.");
      return;
    }
    const message = {
      roomName: payload.roomName,
      message: payload.message,
      senderId: payload.senderId ?? socket.id,
      timestamp: payload.timestamp ?? Date.now(),
    };
    this.socketServer.to(roomKey).emit(this.messageEvent, message);
    if (typeof this.logger.debug === "function") {
      this.logger.debug(
        `Forwarded message from ${socket.id} to room ${payload.roomName}`
      );
    }
  }

  private replyJoin(
    callback: JoinRoomAck | undefined,
    response: JoinRoomResponse
  ): void {
    if (callback) {
      callback(response);
    }
  }

  private validateJoinPayload(payload: JoinRoomPayload): string | undefined {
    if (!payload) {
      return "Missing join payload.";
    }
    if (!payload.roomName?.trim()) {
      return "Room name is required.";
    }
    if (!payload.password) {
      return "Room password is required.";
    }
    return undefined;
  }

  private isValidLocationPayload(payload: UserLocationPayload): boolean {
    if (!payload) {
      return false;
    }
    const hasRoom =
      typeof payload.roomName === "string" &&
      payload.roomName.trim().length > 0;
    const hasLatitude =
      typeof payload.latitude === "number" && Number.isFinite(payload.latitude);
    const hasLongitude =
      typeof payload.longitude === "number" &&
      Number.isFinite(payload.longitude);
    const hasAccuracy =
      typeof payload.accuracy === "number" && payload.accuracy >= 0;
    const hasTimestamp =
      typeof payload.timestamp === "number" && payload.timestamp > 0;
    return (
      hasRoom && hasLatitude && hasLongitude && hasAccuracy && hasTimestamp
    );
  }

  private isValidMessagePayload(payload: RoomMessagePayload): boolean {
    if (!payload) {
      return false;
    }
    const hasRoom =
      typeof payload.roomName === "string" &&
      payload.roomName.trim().length > 0;
    const hasMessage =
      typeof payload.message === "string" && payload.message.trim().length > 0;
    return hasRoom && hasMessage;
  }

  private buildConfig(): SocketConfig {
    const port = this.configService.getOrThrow<number>("SOCKET_PORT");
    const path = this.configService.getOrThrow<string>("SOCKET_PATH");
    const corsOrigin = this.configService
      .get<string>("SOCKET_CORS_ORIGIN", "*")
      .split(",")
      .filter((origin) => Boolean(origin));
    return { port, path, corsOrigins: corsOrigin };
  }
}
