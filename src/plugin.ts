import streamDeck, { JsonObject, LogLevel } from "@elgato/streamdeck";
import { ToggleOnOff } from "./actions/toggle-onoff";
import { MotuApi } from "./motu-avb-api";


// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);


// Register the increment action.
streamDeck.actions.registerAction(new ToggleOnOff());
// streamDeck.actions.registerAction(new ToggleValues());
// streamDeck.actions.registerAction(new SetValue());


// Listen for global settings changes and update MotuApi
streamDeck.settings.onDidReceiveGlobalSettings(async (ev) => {
    streamDeck.logger.trace(`["plugin.ts"] Start receive global settings`, ev);
    
    const globalSettings = ev.settings as JsonObject;
    
    if (globalSettings.motuUrl) {
        const motuApi = MotuApi.getInstance();
        const motuUrl = globalSettings.motuUrl as string;

        let datastoreUpdate = null;

        // Update MotuApi URL if changed. 
        // If url is valid, fetch and return the datastore
        if (motuUrl !== motuApi.getUrl()) {
            datastoreUpdate = await motuApi.setUrl(motuUrl);
        }

        // Save the updated datastore in global settings
        if (datastoreUpdate || !globalSettings.datastore) {
            const datastore = datastoreUpdate as JsonObject
            const newGlobalSettings = { ...globalSettings, datastore };
            streamDeck.settings.setGlobalSettings(newGlobalSettings);
        }

        // Update all currently visible action states
        streamDeck.actions.forEach(async (action) => {
            // Calling getSettings() will trigger the action didReceiveSettings handles
            // that will update its state
            await action.getSettings()
        });

        streamDeck.logger.trace(`["plugin.ts"] End receive global settings`);
    }
});


// On plugin startup, request global settings
streamDeck.settings.getGlobalSettings();


// When System wakes up from sleep/inactivity
streamDeck.system.onSystemDidWakeUp((ev) => {
    streamDeck.logger.trace(`["plugin.ts"] System woke up...`);
});


// Finally, connect to the Stream Deck.
streamDeck.connect();
