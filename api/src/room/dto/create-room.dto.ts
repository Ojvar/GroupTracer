import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

/**
 * CreateRoomDto describes the payload required to register a room.
 */
export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  public name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  public password!: string;
}
