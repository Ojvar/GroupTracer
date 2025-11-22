import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { join } from "node:path";

/**
 * TestController serves the static Socket.IO test page.
 */
@Controller()
export class TestController {
  @Get("test")
  public serveTestPage(@Res() res: Response): void {
    const filePath = join(process.cwd(), "public", "index.html");
    res.sendFile(filePath);
  }
}
