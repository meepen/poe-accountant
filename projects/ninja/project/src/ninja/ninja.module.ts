import { Module } from "@nestjs/common";
import { NinjaController } from "./ninja.controller.js";
import { NinjaService } from "./ninja.service.js";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [NinjaController],
  providers: [NinjaService],
})
export class NinjaModule {}
