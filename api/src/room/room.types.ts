export interface RoomSummary {
  readonly name: string;
}

interface RoomDefinition extends RoomSummary {
  readonly passwordHash: string;
}

export type { RoomDefinition };

