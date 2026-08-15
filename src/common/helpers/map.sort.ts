export function mapSort(sorts: any, excludedValues: string[] = []) {
    if (!sorts) {
        return [];
    }

    const result: Record<string, string>[] = [];

    function processSort(obj: any, path: string[] = []) {
        for (const [key, value] of Object.entries(obj)) {
            if (excludedValues.includes(key)) {
                continue;
            }

            if (typeof value === 'string') {
                const sortItem = path.reduceRight<Record<string, any>>(
                    (acc, curr) => ({
                        [curr]: acc
                    }),
                    { [key]: value.toLowerCase() }
                );
                result.push(sortItem);
            } else if (typeof value === 'object' && value !== null) {
                processSort(value, [...path, key]);
            }
        }
    }

    processSort(sorts);
    return result;
}
