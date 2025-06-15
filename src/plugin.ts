import streamDeck, { JsonObject, LogLevel } from "@elgato/streamdeck";
import { MotuApi } from "./motu-avb-api";
import { ToggleOnOff } from "./actions/toggle-onoff";
import { ToggleValues } from "./actions/toggle-values";
import { SetValue } from "./actions/set-value";
import { RawToggle } from "./actions/raw-toggle";
import { RawSet } from "./actions/raw-set";


// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Singleton instance of the MotuApi utlity class
const motuApi = MotuApi.getInstance();

// Register the increment action.
streamDeck.actions.registerAction(new ToggleOnOff());
streamDeck.actions.registerAction(new ToggleValues());
streamDeck.actions.registerAction(new SetValue());
streamDeck.actions.registerAction(new RawToggle());
streamDeck.actions.registerAction(new RawSet());


// Listen for global settings changes and update MotuApi
streamDeck.settings.onDidReceiveGlobalSettings(async (ev) => {   
    const globalSettings = ev.settings as JsonObject;
    
    if (globalSettings.motuUrl) {
        const motuUrl = globalSettings.motuUrl as string;

        let datastoreUpdate = null;

        // Update MotuApi URL if changed, then fetch and return the datastore
        if (motuUrl !== motuApi.getUrl()) {
            datastoreUpdate = await motuApi.setUrl(motuUrl);
        }

        // Save the updated datastore in global settings
        if (datastoreUpdate) {
            const newGlobalSettings = {...globalSettings, datastore: datastoreUpdate} as JsonObject;
            streamDeck.settings.setGlobalSettings(newGlobalSettings);
            
            streamDeck.actions.forEach(async (action) => {
                // Calling getSettings() will trigger the action didReceiveSettings handle
                // that will update its state
                await action.getSettings()
            });
        }
    }
});


// On plugin startup, request global settings
streamDeck.settings.getGlobalSettings();


// When System wakes up from sleep/inactivity
// streamDeck.system.onSystemDidWakeUp((ev) => {});


// Finally, connect to the Stream Deck.
streamDeck.connect();
