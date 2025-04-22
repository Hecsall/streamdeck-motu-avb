// MOTU API utility
// This singleton handles connection and requests to the MOTU device.

import streamDeck, { JsonObject } from "@elgato/streamdeck";

export type MotuDatastoreResponse = Record<string, string | number>;
export type MotuGetResponse = { value: string | number };


const BOOLEAN_CHANNELS = ["send", "enable", "mute", "solo", "mode", "limit"]; 
const FLOAT_CHANNELS = [
    "fader",
    "ratio",
    "threshold",
    "trim",
    "release",
    "attack",
    "freq",
    "gain",
    "bw",
    "makeup",
    "peak",
    "pan",
    "reduction",
    "reverbtime",
    "mod",
    "tailspread",
    "predelay",
    "hf",
    "mfratio",
    "mf",
    "hfratio",
    "avail"
]

const ALL_CHANNELS = [
    ...BOOLEAN_CHANNELS,
    ...FLOAT_CHANNELS
]

export class MotuApi {
    private static instance: MotuApi;
    private motuUrl: string | null = null;

    updateDatetime: Date | null = null;
    booleanRegex: RegExp = new RegExp(`^mix\/(.*)\/(.*)\/(.*)\/(${BOOLEAN_CHANNELS.join('|')})$`);
    floatRegex: RegExp = new RegExp(`^mix\/(.*)\/(.*)\/(.*)\/(${FLOAT_CHANNELS.join('|')})$`);
    allRegex: RegExp = new RegExp(`^mix\/(.*)\/(.*)\/(.*)\/(${ALL_CHANNELS.join('|')})$`);

    private constructor() {}

    static getInstance(): MotuApi {
        if (!MotuApi.instance) {
            MotuApi.instance = new MotuApi();
        }
        return MotuApi.instance;
    }

    /**
     * Sets the MOTU URL and fetches the datastore.
     * @param url The MOTU URL (e.g. 'http://localhost:1280/abc123/datastore')')
     **/
    async setUrl(url: string): Promise<null|object> {
        streamDeck.logger.trace(`["MotuApi"] setUrl: ${url}`);
        this.motuUrl = url;
        const datastore = await this.fetchDatastore();
        return datastore
    }

    getUrl(): string | null {
        return this.motuUrl
    }

    /**
     * Fetches the entire datastore from the base MOTU URL and stores it internally.
     */
    async fetchDatastore(): Promise<MotuDatastoreResponse> {
        streamDeck.logger.trace(`["MotuApi"] fetchDatastore`);

        if (!this.motuUrl) throw new Error("MOTU URL not set");

        const res = await fetch(this.motuUrl);
        if (!res.ok) throw new Error(`GET ${this.motuUrl} failed: ${res.status}`);

        const data = await res.json() as MotuDatastoreResponse;
        this.updateDatetime = new Date();

        return data;
    }

    /**
     * PATCH a value to a specific endpoint.
     * @param endpoint The endpoint path (e.g. '/mix/chan/0/matrix/mute')
     * @param value The value to set (will be stringified)
     * @returns The updated value from the MOTU API
     */
    async patch(endpoint: string, value: any): Promise<void> {
        if (!this.motuUrl) throw new Error("MOTU URL not set");

        const url = `${this.motuUrl}/${endpoint}`;
        streamDeck.logger.trace(`["MotuApi"] patch`, url, value);
        const formData = new FormData();
        formData.append("json", JSON.stringify({value}));

        const res = await fetch(url, {
            method: "PATCH",
            body: formData
        });

        if (!res.ok) {
            throw new Error(`PATCH ${endpoint} failed: ${res.status}`);
        }

        // Update globalSettings datastore
        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        streamDeck.settings.setGlobalSettings({
            ...globalSettings,
            datastore: {
                ...datastore,
                [endpoint]: value
            }
        });

        return
    }
}
