import streamDeck, { action, DialDownEvent, DialRotateEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { MotuApi } from "../motu-avb-api";

/** amplitudeRatio = 10^(dB / 20) */
function dbToAmplitudeRatio(db: number): number {
    return Math.pow(10, db / 20);
}

/** dB = 20 * log10(amplitudeRatio) */
function amplitudeRatioToDb(amplitudeRatio: number): number {
    return 20 * Math.log10(amplitudeRatio);
}

/**
 * Settings for DialValue action.
 */
type DialValueSettings = {
    rotateEndpoint?: string;
    rotateDelta?: string;
    pressEndpoint?: string;
    pressOnValue?: string;
    pressOffValue?: string;
};


/**
 * Action for Stream Deck + dials.
 * Rotating the dial increments or decrements a datastore endpoint value.
 * Pressing the dial sets a second datastore endpoint to a fixed value.
 */
@action({ UUID: "com.simonedenadai.motu-avb.dialvalue" })
export class DialValue extends SingletonAction<DialValueSettings> {
    private motuApi = MotuApi.getInstance();

    override async onDialRotate(ev: DialRotateEvent<DialValueSettings>): Promise<void> {
        const { rotateEndpoint, rotateDelta = "1" } = ev.payload.settings;

        if (!rotateEndpoint) {
            ev.action.showAlert();
            return;
        }

        const deltaDb = parseFloat(rotateDelta) || 1;

        // Read current amplitude ratio from the cached datastore
        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        const currentRatio = typeof datastore[rotateEndpoint] === "number"
            ? (datastore[rotateEndpoint] as number)
            : 0;

        // Work in dB space, then convert back to amplitude ratio
        const currentDb = currentRatio > 0 ? amplitudeRatioToDb(currentRatio) : -Infinity;
        const newDb = (isFinite(currentDb) ? currentDb : 0) + ev.payload.ticks * deltaDb;
        const newRatio = Math.max(0, Math.min(1, dbToAmplitudeRatio(newDb)));

        await this.motuApi.patch(rotateEndpoint, newRatio);
    }

    override async onDialDown(ev: DialDownEvent<DialValueSettings>): Promise<void> {
        const { pressEndpoint, pressOnValue, pressOffValue } = ev.payload.settings;

        if (!pressEndpoint || pressOnValue === undefined || pressOffValue === undefined) {
            return;
        }

        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        const current = datastore[pressEndpoint];

        const parsedOnValue = parseFloat(pressOnValue);
        const parsedOffValue = parseFloat(pressOffValue);
        const next = current === parsedOnValue ? parsedOffValue : parsedOnValue;

        await this.motuApi.patch(pressEndpoint, next);
    }
}
