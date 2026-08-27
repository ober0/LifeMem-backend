export interface OpenstreetJson {
    country: {
        name: string;
        code: string;
    };
    region: string;
    city: string;
    suburb: string | null;
    quarter: string | null;
    neighbourhood: string | null;
    road: string | null;
    house: string | null;
}

export interface OpenstreetReverseResponse {
    shortName: string;
    fullName: string;
    json: OpenstreetJson;
}
