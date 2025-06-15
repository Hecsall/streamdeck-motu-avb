import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, PropertyInspectorDidAppearEvent, JsonValue, SendToPluginEvent, DidReceiveSettingsEvent, JsonObject } from "@elgato/streamdeck";
import { MotuApi } from "../motu-avb-api";

/**
 * Settings for SetValue action.
 */
type RawSetSettings = {
    endpoint?: string;
    value?: string;
};


/**
 * Action to set a single Value.
 */
@action({ UUID: "com.simonedenadai.motu-avb.rawset" })
export class RawSet extends SingletonAction<RawSetSettings> {
    private motuApi = MotuApi.getInstance();

    // When property inspector is opened in the Stream Deck app
    // override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> { }
  
    // onDidReceiveSettings runs when you EDIT a setting, or when you call action.getSettings()
    // override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SetValueSettings>): Promise<void> {}
    
    // onWillAppear runs when the action is rendered on the current StreamDeck page, (also when switching pages)
    // Beware, this runs BEFORE the plugin.ts onDidReceiveGlobalSettings event!
    // override async onWillAppear(ev: WillAppearEvent<SetValueSettings>): Promise<void> {
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

    override async onKeyDown(ev: KeyDownEvent<RawSetSettings>): Promise<void> {        
        const {endpoint, value = ""} = ev.payload.settings;

        if (!endpoint) {
            ev.action.showAlert();
            return
        };
        
        const parsedValue = value; // No need to parse in this raw action
        
        // Patch new value
        await this.motuApi.patch(endpoint, parsedValue);
        
        // StreamDeck SDK automatically switches state when you press the key
        // no need to set it manually.
    }

    // onSendToPlugin is called when property inspector calls the plugin to get data using the datasource attribute
    override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, RawSetSettings>): Promise<void> {
        const {event} = ev.payload as JsonObject;

        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};

        if (event === "getEndpoints") {
            // Filter for boolean and float endpoints
            const endpoints = Object.keys(datastore).filter((endpoint) => this.motuApi.allRegex.test(endpoint));
            
            await streamDeck.ui.current?.sendToPropertyInspector({
                event, 
                items: endpoints.map((endpoint) => ({label: endpoint, value: endpoint})),
            });
        }
    }
}