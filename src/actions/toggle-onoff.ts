import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, PropertyInspectorDidAppearEvent, JsonValue, SendToPluginEvent, DidReceiveSettingsEvent, JsonObject } from "@elgato/streamdeck";
import { MotuApi } from "../motu-avb-api";

/**
 * Action to toggle an ON/OFF endpoint (0/1) on the MOTU AVB device.
 */
@action({ UUID: "com.simonedenadai.motu-avb-canary.toggleonoff" })
export class ToggleOnOff extends SingletonAction<ToggleOnOffSettings> {
    private motu = MotuApi.getInstance();

    // When property inspector is opened in the Stream Deck app
    // override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): Promise<void> {
    //     const globalSettings = streamDeck.settings.getGlobalSettings();
    //     const datastore = await this.motu.fetchDatastore();
    //     const endpoints = Object.keys(datastore);
    // }

    private updateActionState = async (ev: any) => {
        // Fetch current value from datastore
        const datastore = await this.motu.getDatastore();
        const endpoint = ev.payload.settings.endpoint;

        if (datastore && endpoint) {
            const currentValue = datastore[endpoint];

            streamDeck.logger.trace(`["action"] Receive settings`, currentValue);

            if (ev.action.isKey()){
                await ev.action.setState(currentValue === 1 ? 1 : 0);
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
    override async onWillAppear(ev: WillAppearEvent<ToggleOnOffSettings>): Promise<void> {
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
        streamDeck.logger.trace(`["action"] willAppear`, ev, ev.payload.settings.endpoint);
        
        const endpoint = ev.payload.settings.endpoint;

        if (!endpoint) {
            ev.action.showAlert();
            return;
        }

        this.updateActionState(ev)
    }

    override async onKeyDown(ev: KeyDownEvent<ToggleOnOffSettings>): Promise<void> {
        streamDeck.logger.trace(`["action"] Key pressed!`);
        const endpoint = ev.payload.settings.endpoint;
        
        if (!endpoint) {
            ev.action.showAlert();
            return
        };

        // Get current value
        const datastore = await this.motu.getDatastore();
        const current = datastore[endpoint];
        const next = current === 1 ? 0 : 1;
        
        // Patch new value
        await this.motu.patch(endpoint, next);
        
        // StreamDeck SDK automatically switches state when you press the key
        // await ev.action.setState(next === 1 ? 1 : 0);
    }

    // onSendToPlugin is called when property inspector calls the plugin to get data using the datasource attribute
    override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, ToggleOnOffSettings>): Promise<void> {
        streamDeck.logger.trace(`["action"] Send to plugin`, ev);
        const {action, event, context} = ev.payload as JsonObject;

        if (event === "getEndpoints") {
            const datastore = await this.motu.getDatastore();
            const endpoints = Object.keys(datastore);
        
            await streamDeck.ui.current?.sendToPropertyInspector({
                event: "getEndpoints", 
                items: endpoints.map((endpoint) => ({label: endpoint, value: endpoint})),
            });
        }
    }
}

/**
 * Settings for ToggleOnOff action.
 */
type ToggleOnOffSettings = {
    endpoint?: string;
};
