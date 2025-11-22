import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RoomModule } from "./room/room.module";
import { SocketModule } from "./socket/socket.module";
import { TestController } from "./test/test.controller";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RoomModule, SocketModule],
  controllers: [TestController],
})
export class AppModule {}
