import { tool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import type { AiToolFactory } from '../ai-tool.factory';
import { AiToolKey } from '../ai-tool-key.enum';

@Injectable()
export class TestFactory implements AiToolFactory {
    readonly key = AiToolKey.Test;

    create() {
        return tool(
            async ({ message }) => {
                return JSON.stringify({
                    echo: message,
                    tool: AiToolKey.Test
                });
            },
            {
                name: AiToolKey.Test,
                description: 'test',
                schema: z.object({
                    message: z.string().describe('test')
                })
            }
        );
    }
}
