import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, PropertyInspectorDidAppearEvent, JsonValue, SendToPluginEvent, DidReceiveSettingsEvent, JsonObject } from "@elgato/streamdeck";
import { MotuApi } from "../motu-avb-api";

/**
 * Settings for ToggleOnOff action.
 */
type ToggleOnOffSettings = {
    endpoint?: string;
};


/**
 * Action to toggle an ON/OFF endpoint (1/0) on the MOTU AVB device.
 */
@action({ UUID: "com.simonedenadai.motu-avb-canary.toggleonoff" })
export class ToggleOnOff extends SingletonAction<ToggleOnOffSettings> {
    private motuApi = MotuApi.getInstance();

    // When property inspector is opened in the Stream Deck app
    // override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> { }

    private updateActionState = async (ev: any) => {
        // Fetch current value from datastore
        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};
        const endpoint = ev.payload.settings.endpoint;
        const onValue = 1;

        if (datastore && endpoint) {
            const currentValue = datastore[endpoint];

            if (ev.action.isKey()){
                await ev.action.setState(currentValue === onValue ? 1 : 0);
            }
        }
    }
  
    // onDidReceiveSettings runs when you EDIT a setting, or when you call action.getSettings()
    override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<ToggleOnOffSettings>): Promise<void> {
        streamDeck.logger.trace(`["action"] Receive settings`, ev);

        this.updateActionState(ev);
    }
    
    // onWillAppear runs when the action is rendered on the current StreamDeck page, (also when switching pages)
    // Beware, this runs BEFORE the plugin.ts onDidReceiveGlobalSettings event!
    // override async onWillAppear(ev: WillAppearEvent<ToggleOnOffSettings>): Promise<void> {
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

        // streamDeck.logger.trace(`["action"] willAppear`, ev, ev.payload.settings.endpoint);
    // }

    override async onKeyDown(ev: KeyDownEvent<ToggleOnOffSettings>): Promise<void> {
        streamDeck.logger.trace(`["action"] Key pressed!`, ev);
        const endpoint = ev.payload.settings.endpoint;
        const onValue = 1;
        const offValue = 0;

        if (!endpoint) {
            ev.action.showAlert();
            return
        };

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
        const next = current === onValue ? offValue : onValue;
        
        // Patch new value
        await this.motuApi.patch(endpoint, next);
        
        // StreamDeck SDK automatically switches state when you press the key
        // no need to set it manually.
    }

    // onSendToPlugin is called when property inspector calls the plugin to get data using the datasource attribute
    override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, ToggleOnOffSettings>): Promise<void> {
        const {event} = ev.payload as JsonObject;

        const globalSettings = await streamDeck.settings.getGlobalSettings();
        const datastore = globalSettings.datastore as JsonObject || {};

        if (event === "getEndpoints") {
            // Filter for boolean-only endpoints
            const endpoints = Object.keys(datastore).filter((endpoint) => this.motuApi.booleanRegex.test(endpoint));
            
            await streamDeck.ui.current?.sendToPropertyInspector({
                event, 
                items: endpoints.map((endpoint) => ({label: endpoint, value: endpoint})),
            });
        }
    }
}