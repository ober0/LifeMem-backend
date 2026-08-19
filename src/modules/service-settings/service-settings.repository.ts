import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { ServiceSettingsJsonDto } from "./dto/settings-json.dto";

@Injectable()
export class ServiceSettingsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByServiceUuid() {
        return this.prisma.serviceSettings.findFirst();
    }

    async upsert(json: ServiceSettingsJsonDto) {
        const plainJson = JSON.parse(JSON.stringify(json));
        const first = await this.prisma.serviceSettings.findFirst();

        return this.prisma.serviceSettings.upsert({
            where: {
                id: first?.id
            },
            update: {
                json: plainJson
            },
            create: {
                json: plainJson
            }
        });
    }
}
