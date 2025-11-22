import { Module } from "@nestjs/common";
import { RoomModule } from "../room/room.module";
import { SocketService } from "./socket.service";

/**
 * SocketModule wires the shared SocketService provider.
 */
@Module({
  imports: [RoomModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}

