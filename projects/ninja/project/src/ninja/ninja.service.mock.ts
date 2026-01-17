import { ClassProvider } from "@nestjs/common";
import { NinjaService } from "./ninja.service.js";
import { vi } from "vitest";

export class NinjaServiceMockImpl implements NinjaService {
  public getItemPrice = vi.fn<typeof NinjaService.prototype.getItemPrice>();
  public getTabPrice = vi.fn<typeof NinjaService.prototype.getTabPrice>();
  public getItemPriceResult =
    vi.fn<typeof NinjaService.prototype.getItemPriceResult>();
  public getTabPriceResult =
    vi.fn<typeof NinjaService.prototype.getTabPriceResult>();
}

export const NinjaServiceMock: ClassProvider<NinjaService> = {
  provide: NinjaService,
  useClass: NinjaServiceMockImpl,
};
