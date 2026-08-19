import { Module } from "@nestjs/common";

import { GoogleApiService } from "./google-api.service";

@Module({
    providers: [GoogleApiService],
    exports: [GoogleApiService]
})
export class GoogleApiModule {}

