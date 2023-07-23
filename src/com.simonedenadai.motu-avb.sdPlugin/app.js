/* eslint-disable no-console */
/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />


const toggleonoffAction = new Action('com.simonedenadai.motu-avb.toggleonoff');
const toggleonoffActions = {};

const togglevaluesAction = new Action('com.simonedenadai.motu-avb.togglevalues');
const togglevaluesActions = {};

const setvalueAction = new Action('com.simonedenadai.motu-avb.setvalue');
const setvalueActions = {};


let globalSettings = {};
let needsReFetch = true;
let axiosInstance;


async function updateActionState(actionsObject) {
    Object.keys(actionsObject).forEach(async (uuid) => {
        const action = actionsObject[uuid];
        if (action.payload.settings.motu_target) {
            await axiosInstance.get(`${globalSettings.api_url}/${action.payload.settings.motu_target}`)
                .then((res) => {
                    if (res.data.value === parseFloat(action.payload.settings.on_value)) {
                        $SD.setState(uuid, 1);
                    } else {
                        $SD.setState(uuid, 0);
                    }
                })
                .catch((error) => {
                    console.error('[updateActionState] request failed:', error);
                    $SD.showAlert(uuid);
                });
        }
    });
}


async function fetchMOTU() {
    return axiosInstance.get()
        .then((response) => response.data)
        .catch((error) => {
            console.error('[fetchMOTU] request failed:', error);
            return null;
        });
}


async function sendToMOTU(endpoint, value) {
    if (globalSettings?.api_url) {
        const formdata = new FormData();
        const valueToEncode = { value };
        formdata.append('json', JSON.stringify(valueToEncode));

        return axiosInstance.patch(
            `${globalSettings?.api_url}/${endpoint}`,
            formdata,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        )
            .then((response) => response)
            .catch((error) => {
                console.error('[sendToMOTU] request failed:', error);
                return null;
            });
    }
    return null;
}


async function getOrCreateDatastore() {
    if (needsReFetch || !globalSettings.datastore) {
        const datastore = await fetchMOTU();
        if (datastore) {
            const newGlobalSettings = {
                ...globalSettings,
                datastore,
            };
            $SD.setGlobalSettings(newGlobalSettings);
            globalSettings = newGlobalSettings;
            needsReFetch = false;
        }
    }
    return globalSettings?.datastore;
}


/**
 * The first event fired when Stream Deck starts
 * { actionInfo, appInfo, connection, messageType, port, uuid }
 */
$SD.onConnected(({ uuid }) => {
    // $SD.setGlobalSettings({}); // Used to clear global settings
    $SD.getGlobalSettings(uuid);
});


$SD.onDidReceiveGlobalSettings(async (jsn) => {
    const receivedGlobalSettings = jsn?.payload?.settings;
    if (receivedGlobalSettings) {
        globalSettings = receivedGlobalSettings;

        // If API URL is already set, fetch the entire
        // MOTU datastore to get some starting values.
        if (globalSettings.api_url) {
            // Create the axios instance for all future requests
            if (!axiosInstance) {
                axiosInstance = axios.create({
                    baseURL: globalSettings.api_url,
                    timeout: 1000,
                });
            }

            await getOrCreateDatastore();

            // Set actions initial state when receiving a new datastore
            updateActionState(toggleonoffActions);
            updateActionState(togglevaluesActions);
        }
        console.log('Global settings', globalSettings);
    } else {
        console.log('Unable to cache global settings; payload.settings field not found');
    }
});


// On willAppear, store used actions inside their respective collection for later use
toggleonoffAction.onWillAppear(async (jsn) => {
    toggleonoffActions[jsn.context] = jsn;
});

togglevaluesAction.onWillAppear(async (jsn) => {
    togglevaluesActions[jsn.context] = jsn;
});

setvalueAction.onWillAppear(async (jsn) => {
    setvalueActions[jsn.context] = jsn;
});

// { action, context, device, event, payload }
toggleonoffAction.onKeyUp(async ({ context, payload }) => {
    const motuTarget = payload?.settings?.motu_target;
    const offValue = payload?.settings?.off_value;
    const onValue = payload?.settings?.on_value;
    // Keep going only if the key is correctly configured
    if (!motuTarget || !offValue || !onValue) {
        $SD.showAlert(context);
        return;
    }

    let value = 0;
    let newState = 0;
    if (payload.state === 0) {
        newState = 1;
        value = 1;
    }

    const response = await sendToMOTU(motuTarget, value);
    if (response.status === 204) {
        globalSettings.datastore[motuTarget] = parseInt(value, 10);
        // If used from a MultiAction avoid changing the action state.
        if (!payload.isInMultiAction) {
            $SD.setState(
                context,
                newState,
            );
        }
    } else {
        $SD.showAlert(context);
    }
});

togglevaluesAction.onKeyUp(async ({ context, payload }) => {
    const motuTarget = payload?.settings?.motu_target;
    const offValue = payload?.settings?.off_value;
    const onValue = payload?.settings?.on_value;

    // Keep going only if the key is correctly configured
    if (!motuTarget || !offValue || !onValue) {
        $SD.showAlert(context);
        return;
    }

    let value = offValue;
    let newState = 0;
    if (payload.state === 0) {
        newState = 1;
        value = onValue;
    }

    const response = await sendToMOTU(motuTarget, value);
    if (response.status === 204) {
        globalSettings.datastore[motuTarget] = parseFloat(value);
        // If used from a MultiAction avoid changing the action state.
        if (!payload.isInMultiAction) {
            $SD.setState(
                context,
                newState,
            );
        }
    } else {
        $SD.showAlert(context);
    }
});


setvalueAction.onKeyUp(async ({ context, payload }) => {
    const motuTarget = payload?.settings?.motu_target;
    const setValue = payload?.settings?.set_value;

    // Keep going only if the key is correctly configured
    if (!motuTarget || !setValue) {
        $SD.showAlert(context);
        return;
    }

    const response = await sendToMOTU(motuTarget, setValue);
    if (response.status === 204) {
        globalSettings.datastore[motuTarget] = parseFloat(setValue);
    } else {
        $SD.showAlert(context);
    }
});
