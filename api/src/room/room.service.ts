import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { CreateRoomDto } from "./dto/create-room.dto";
import type { RoomDefinition, RoomSummary } from "./room.types";

/**
 * RoomService stores the registered rooms and secures them with passwords.
 */
@Injectable()
export class RoomService {
  private readonly rooms = new Map<string, RoomDefinition>();

  public createRoom(createRoomDto: CreateRoomDto): RoomSummary {
    const normalizedName = this.normalizeRoomName(createRoomDto.name);
    if (this.rooms.has(normalizedName)) {
      throw new ConflictException(`Room "${createRoomDto.name}" already exists.`);
    }
    const room: RoomDefinition = {
      name: createRoomDto.name.trim(),
      passwordHash: this.hashPassword(createRoomDto.password),
    };
    this.rooms.set(normalizedName, room);
    return { name: room.name };
  }

  public ensureRoomAccess(roomName: string, password: string): RoomSummary {
    const normalizedName = this.normalizeRoomName(roomName);
    const room = this.rooms.get(normalizedName);
    if (!room) {
      throw new NotFoundException(`Room "${roomName}" does not exist.`);
    }
    const passwordHash = this.hashPassword(password);
    if (passwordHash !== room.passwordHash) {
      throw new UnauthorizedException("Invalid room password.");
    }
    return { name: room.name };
  }

  public normalizeRoomName(roomName: string): string {
    return roomName.trim().toLowerCase();
  }

  private hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
  }
}

