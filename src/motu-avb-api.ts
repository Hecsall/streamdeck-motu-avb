// MOTU API utility
// This singleton handles connection and requests to the MOTU device.

import streamDeck from "@elgato/streamdeck";

export type MotuDatastoreResponse = Record<string, string | number>;
export type MotuGetResponse = { value: string | number };


export class MotuApi {
    private static instance: MotuApi;
    private motuUrl: string | undefined;
    private datastore: MotuDatastoreResponse = {};
    private updateDatetime: Date | undefined;

    private constructor() {}

    static getInstance(): MotuApi {
        if (!MotuApi.instance) {
            MotuApi.instance = new MotuApi();
        }
        return MotuApi.instance;
    }

    private async checkUrl(url: string): Promise<boolean> {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
            return false;
        }
        return true;
    }

    /**
     * Sets the MOTU URL and fetches the datastore.
     * @param url The MOTU URL (e.g. 'http://localhost:1280/abc123/datastore')')
     **/
    async setUrl(url: string): Promise<null|object> {
        streamDeck.logger.trace(`["MotuApi"] setUrl: ${url}`);
        this.motuUrl = url;
        // Check URL validity and fetch datastore
        const isValidUrl = await this.checkUrl(url)
        let datastore = null;

        if (isValidUrl) {
            streamDeck.logger.trace(`["MotuApi"] URL is valid`);
            datastore = await this.fetchDatastore();
        };
        return datastore
    }

    getUrl(): string | undefined {
        if (!this.motuUrl) {
            return undefined;
        }

        return this.motuUrl.replace(/\/+$/, ""); // Remove trailing slashes
    }

    /**
     * Fetches a single endpoint from the MOTU API.
     * @param path The endpoint path (e.g. '/mix/chan/0/matrix/mute')
     * @returns The current endpoint value from the MOTU API
     * @throws Error if the MOTU URL is not set or the fetch fails
     */
    async get(path: string): Promise<MotuGetResponse> {
        if (!this.getUrl()) throw new Error("MOTU URL not set");

        const res = await fetch(`${this.getUrl()}/${path}`);
        if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);

        return await res.json() as MotuGetResponse;
    }

    // TODO
    // private filterDatastore(datastore: MotuDatastoreResponse): MotuDatastoreResponse {
    // }

    /**
     * Fetches the entire datastore from the base MOTU URL and stores it internally.
     */
    async fetchDatastore(): Promise<MotuDatastoreResponse> {
        streamDeck.logger.trace(`["MotuApi"] fetchDatastore`);
        if (!this.getUrl()) throw new Error("MOTU URL not set");

        const res = await fetch(this.getUrl() as string);
        if (!res.ok) throw new Error(`GET ${this.getUrl()} failed: ${res.status}`);

        const data = await res.json() as MotuDatastoreResponse;
        // TODO: filter datastore and save only relevant endpoints
        // this.datastore = this.filterDatastore(data);
        this.datastore = data;
        this.updateDatetime = new Date();

        return data;
    }

    /**
     * Returns the last fetched datastore, or fetches it if not available yet.
     */
    async getDatastore(): Promise<MotuDatastoreResponse> {
        // TODO: datastore refetch logic every 1 hour? (on key interaction)
        if (!this.datastore) {
            await this.fetchDatastore();
        }
        return this.datastore!;
    }

    /**
     * PATCH a value to a specific endpoint.
     * @param endpoint The endpoint path (e.g. '/mix/chan/0/matrix/mute')
     * @param value The value to set (will be stringified)
     * @returns The updated value from the MOTU API
     */
    async patch(endpoint: string, value: any): Promise<void> {
        if (!this.getUrl()) throw new Error("MOTU URL not set");

        const url = `${this.getUrl()}/${endpoint}`;
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

        // Update local datastore
        this.datastore[endpoint] = value;
        return
    }
}
