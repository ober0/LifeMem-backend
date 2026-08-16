import { Module } from "@nestjs/common";
import { AppleApiService } from "./apple-api.service";

@Module({
    providers: [AppleApiService],
    exports: [AppleApiService]
})
export class AppleApiModule {}

