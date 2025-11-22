import { Body, Controller, Post } from "@nestjs/common";
import { CreateRoomDto } from "./dto/create-room.dto";
import { RoomService } from "./room.service";
import type { RoomSummary } from "./room.types";

/**
 * RoomController exposes REST endpoints to manage rooms.
 */
@Controller("rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  public createRoom(@Body() createRoomDto: CreateRoomDto): RoomSummary {
    return this.roomService.createRoom(createRoomDto);
  }
}

