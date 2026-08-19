import { PartialType } from "@nestjs/swagger";

import { ServiceSettingsJsonDto } from "./settings-json.dto";

export class ServiceSettingsUpdateDto extends PartialType(ServiceSettingsJsonDto) {}
