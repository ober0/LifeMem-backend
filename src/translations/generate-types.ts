import fs from 'node:fs';
import path from 'node:path';
import { LangEnum } from '../common/types/lang.enum';

const LOCALES_DIR = path.resolve('src/translations');
const OUTPUT_FILE = path.resolve('src/translations/generated.d.ts');

type JsonObject = Record<string, unknown>;

const flattenKeys = (value: JsonObject, prefix = ''): string[] => {
    const keys: string[] = [];

    for (const [key, child] of Object.entries(value)) {
        const currentKey = prefix ? `${prefix}.${key}` : key;

        if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
            const childKeys = Object.keys(child);

            if (childKeys.every((key) => (Object.values(LangEnum) as string[]).includes(key))) {
                keys.push(currentKey);
                continue;
            }

            keys.push(...flattenKeys(child as JsonObject, currentKey));
        } else {
            keys.push(currentKey);
        }
    }

    return keys;
};

function main() {
    const dir = path.resolve(LOCALES_DIR);

    const folders = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    const contents: string[] = [];

    for (const folder of folders) {
        const files = fs.readdirSync(path.join(LOCALES_DIR, folder)).filter((file) => file.endsWith('.json'));

        const keys = new Set<string>();

        for (const file of files) {
            const fileName = path.basename(file, '.json');

            let json: JsonObject;

            try {
                json = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, folder, file), 'utf8')) as JsonObject;
            } catch (e) {
                console.error(`File with error:  ${file}`);
                console.error(e);
                return;
            }

            for (const key of flattenKeys(json)) {
                keys.add(`${fileName}.${key}`);
            }
        }

        const folderFormatted = `${folder[0].toUpperCase()}${folder.substring(1).toLowerCase()}`;

        const content = `export type ${folderFormatted}TranslationKey =
            ${[...keys]
                .sort()
                .map((key) => `  | '${key}'`)
                .join('\n')};`;

        contents.push(content);

        console.log(`Generated ${keys.size} translation keys`);
    }

    const result = contents.join('\n\n\n');

    fs.mkdirSync(path.dirname(OUTPUT_FILE), {
        recursive: true
    });
    fs.writeFileSync(OUTPUT_FILE, result);
}

main();
