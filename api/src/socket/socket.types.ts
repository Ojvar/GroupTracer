export interface SocketConfig {
  readonly port: number;
  readonly path: string;
  readonly corsOrigins: string[];
}

export interface JoinRoomPayload {
  readonly roomName: string;
  readonly password: string;
}

export interface JoinRoomResponse {
  readonly success: boolean;
  readonly message?: string;
}

export interface UserLocationPayload {
  readonly roomName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly timestamp: number;
}

export interface RoomMessagePayload {
  readonly roomName: string;
  readonly message: string;
  readonly senderId?: string;
  readonly timestamp?: number;
}
