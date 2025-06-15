import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, PropertyInspectorDidAppearEvent, JsonValue, SendToPluginEvent, DidReceiveSettingsEvent, JsonObject } from "@elgato/streamdeck";
import { MotuApi } from "../motu-avb-api";

/**
 * Settings for RawAction action.
 */
type RawToggleSettings = {
    endpoint?: string;
    onValue?: string;
    offValue?: string;
};


/**
 * Action to toggle an arbitrary endpoint between two values.
 * This is intended for advanced users who want to control special endpoints.
 */
@action({ UUID: "com.simonedenadai.motu-avb.rawtoggle" })
export class RawToggle extends SingletonAction<RawToggleSettings> {
    private motuApi = MotuApi.getInstance();

    // When property inspector is opened in the Stream Deck app
    // override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> { }

    private updateActionState = async (ev: any) => {
        // Fetch current value from datastore
        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        const endpoint = ev.payload.settings.endpoint;
        const onValue = ev.payload.settings.onValue;

        if (datastore && endpoint) {
            const currentValue = datastore[endpoint];

            if (ev.action.isKey()){
                await ev.action.setState(currentValue === onValue ? 1 : 0);
            }
        }
    }
  
    // onDidReceiveSettings runs when you EDIT a setting, or when you call action.getSettings()
    override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<RawToggleSettings>): Promise<void> {
        this.updateActionState(ev);
    }
    
    // onWillAppear runs when the action is rendered on the current StreamDeck page, (also when switching pages)
    // Beware, this runs BEFORE the plugin.ts onDidReceiveGlobalSettings event!
    // override async onWillAppear(ev: WillAppearEvent<RawActionSettings>): Promise<void> {
        // {
        //  "type":"willAppear",
        //  "action":{
        //      "controllerType":"Keypad", [...],
        //      "payload":{
        //          "controller":"Keypad",
        //          "coordinates":{"column":2,"row":2},
        //          "isInMultiAction":false,
        //          "settings":{"endpoint":"mix/chan/0/matrix/mute"},
        //          "state":0
        //      }
        // }
    // }

    override async onKeyDown(ev: KeyDownEvent<RawToggleSettings>): Promise<void> {        
        // Since we accept arbitrary values for ON and OFF, we default to empty srting if not set.
        const {endpoint, onValue = "", offValue = ""} = ev.payload.settings;

        if (!endpoint || !onValue) {
            ev.action.showAlert();
            return
        };
        
        const parsedOnValue = onValue; // No need to parse in this raw action
        const parsedOffValue = offValue; // No need to parse in this raw action

        // Get current value
        // TODO: Maybe I can avoid this reading from globalSettings
        // and base my decision on the current state of the action
        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        
        if (!datastore) {
            ev.action.showAlert();
            return;
        }
        
        const current = datastore[endpoint];
        const next = current === parsedOnValue ? parsedOffValue : parsedOnValue;
        
        // Patch new value
        await this.motuApi.patch(endpoint, next);
        
        // StreamDeck SDK automatically switches state when you press the key
        // no need to set it manually.
    }
}