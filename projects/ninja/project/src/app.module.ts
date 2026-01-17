import { Module } from "@nestjs/common";
import { NinjaModule } from "./ninja/ninja.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [NinjaModule, HealthModule],
})
export class AppModule {}
