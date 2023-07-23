/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />


const toggleonoffAction = new Action('com.simonedenadai.motu-avb.toggleonoff');
let toggleonoffActions = {}

const togglevaluesAction = new Action('com.simonedenadai.motu-avb.togglevalues');
let togglevaluesActions = {}

const setvalueAction = new Action('com.simonedenadai.motu-avb.setvalue');
let setvalueActions = {}



let globalSettings = {};
let needsReFetch = true;


async function setBooleanActionState(actionsObject) {
    Object.keys(actionsObject).forEach(async (uuid) => {
        const action = actionsObject[uuid]
        if (action.payload.settings.motu_target) {
            const response = await fetch(`${globalSettings.api_url}/${action.payload.settings.motu_target}`).then((response) => response.json());
            
            if (response.value === 1) {
                $SD.setState(uuid, 1)
            } else {
                $SD.setState(uuid, 0)
            }
        }
    })
}

async function setNumericalActionState(actionsObject) {
    Object.keys(actionsObject).forEach(async (uuid) => {
        const action = actionsObject[uuid]
        if (action.payload.settings.motu_target) {
            const response = await fetch(`${globalSettings.api_url}/${action.payload.settings.motu_target}`).then((response) => response.json());
            
            if (response.value === parseFloat(action.payload.settings.on_value)) {
                $SD.setState(uuid, 1)
            } else {
                $SD.setState(uuid, 0)
            }
        }
    })
}


function fetchMOTU() {
    return fetch(globalSettings?.api_url).then((response) => {
        switch (response.status) {
            case 200:
                return response.json();
            default:
                return null;
        }
    })
}


async function getOrCreateDatastore(refetch) {
    if (needsReFetch || !globalSettings.datastore) {
        const datastore = await fetchMOTU()
        if (datastore) {
            const newGlobalSettings = {
                ...globalSettings,
                datastore: datastore
            }
            $SD.setGlobalSettings(newGlobalSettings);
            globalSettings = newGlobalSettings;
            needsReFetch = false;
        }
    }
    return globalSettings?.datastore
}


function sendToMOTU(endpoint, value) {
    if (globalSettings?.api_url) {    
        var formdata = new FormData();
        const valueToEncode = {"value": value}
        formdata.append("json", JSON.stringify(valueToEncode));

        return fetch(`${globalSettings?.api_url}/${endpoint}`, {
            method: 'PATCH',
            body: formdata,
        }).then((response) => {
            return response
        }).catch((error) => {
            console.error(error)
        });
    }
}


/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
    // $SD.setGlobalSettings({}); // Used to clean global settings
	$SD.getGlobalSettings(uuid);
});


$SD.onDidReceiveGlobalSettings(async (jsn) => {
    let receivedGlobalSettings = jsn?.payload?.settings;
    if (receivedGlobalSettings) {
        globalSettings = receivedGlobalSettings;

        // If API URL is already set, fetch the entire
        // MOTU datastore to get some starting values.
        if (globalSettings.api_url) {
            await getOrCreateDatastore(needsReFetch);
            
            // Set Toggle actions initial state when receiving a new datastore
            setBooleanActionState(toggleonoffActions);
            setNumericalActionState(togglevaluesActions);
        }
        console.log('cached global settings', globalSettings);
    }
    else {
        console.log('unable to cache global settings; payload.settings field not found');
    }
})


// On willAppear, store used actions inside their respective collection for later use
toggleonoffAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    toggleonoffActions[context] = { action, device, event, payload };
});

togglevaluesAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    togglevaluesActions[context] = { action, device, event, payload };
});

setvalueAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    setvalueActions[context] = { action, device, event, payload };
});


toggleonoffAction.onKeyUp(async ({ action, context, device, event, payload }) => {
    const motu_target = payload?.settings?.motu_target;
    const off_value = payload?.settings?.off_value;
    const on_value = payload?.settings?.on_value;

    // Keep going only if the key is correctly configured
    if (!motu_target || !off_value || !on_value) {
        $SD.showAlert(context);
        return
    }

    let value = 0;
    let newState = 0;
    if (payload.state === 0) {
        newState = 1;
        value = 1;
    }

    const response = await sendToMOTU(motu_target, value);
    if (response.ok) {
        globalSettings.datastore[motu_target] = parseInt(value);
        // If used from a MultiAction avoid changing the action state.
        if (!payload.isInMultiAction) {
            $SD.setState(
                context, 
                newState
            );
        }
    } else {
        $SD.showAlert(context);
    }
});

togglevaluesAction.onKeyUp(async ({ action, context, device, event, payload }) => {
    const motu_target = payload?.settings?.motu_target;
    const off_value = payload?.settings?.off_value;
    const on_value = payload?.settings?.on_value;

    // Keep going only if the key is correctly configured
    if (!motu_target || !off_value || !on_value) {
        $SD.showAlert(context);
        return
    }

    let value = off_value;
    let newState = 0;
    if (payload.state === 0) {
        newState = 1;
        value = on_value;
    }

    const response = await sendToMOTU(motu_target, value);
    if (response.ok) {
        globalSettings.datastore[motu_target] = parseFloat(value);
        // If used from a MultiAction avoid changing the action state.
        if (!payload.isInMultiAction) {
            $SD.setState(
                context, 
                newState
            );
        }
    } else {
        $SD.showAlert(context);
    }
});


setvalueAction.onKeyUp(async ({ action, context, device, event, payload }) => {
    const motu_target = payload?.settings?.motu_target;
    const set_value = payload?.settings?.set_value;

    // Keep going only if the key is correctly configured
    if (!motu_target || !set_value) {
        $SD.showAlert(context);
        return
    }

    const response = await sendToMOTU(motu_target, set_value);
    if (response.ok) {
        globalSettings.datastore[motu_target] = parseFloat(set_value);
    } else {
        $SD.showAlert(context);
    }
});