/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const muteAction = new Action('com.simonedenadai.motu-avb.mute');

let globalSettings = {};

async function createDatastore() {
    const datastore = await fetchMOTU()
    if (datastore) {
        const newGlobalSettings = {
            ...globalSettings,
            datastore: datastore
        }
        $SD.setGlobalSettings(newGlobalSettings);
        globalSettings = newGlobalSettings;
    }
}


async function getOrCreateDatastore() {
    if (!globalSettings.datastore) {
        await createDatastore();
    }
    return globalSettings?.datastore
}


function fetchMOTU() {
    return fetch(globalSettings?.api_url)
        .then((response) => {
            console.log(response);
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    return null;
            }
        })
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
	$SD.getGlobalSettings($SD.uuid);
});


$SD.on('didReceiveGlobalSettings', async (jsn) => {
    let receivedGlobalSettings = jsn?.payload?.settings;
    if (receivedGlobalSettings) {
        globalSettings = receivedGlobalSettings;

        // If API URL is already set, fetch the entire
        // MOTU datastore to get some starting values.
        if (globalSettings.api_url) {
            await createDatastore();
        }
        console.log('cached the received global settings!');
        console.log(globalSettings);
    }
    else {
        console.log('unable to cache global settings; payload.settings field not found');
    }
});


// muteAction.onSendToPlugin(({ context, payload }) => {
// 	console.log('onSendToPlugin', context, payload);
// })


muteAction.onKeyUp(async ({ action, context, device, event, payload }) => {
    const motu_target = payload?.settings?.motu_target;
    // Keep going only if the key is correctly configured
    if (!motu_target) {
        $SD.showAlert(context)
        return
    }

    // const datastore = await getOrCreateDatastore();
    // const currentStatus = datastore[motu_target]
    // const value = currentStatus == 1 ? 0 : 1;

    let value;
    let newState;
    if (payload.state === 0) {
        newState = 1
        value = 1
    } else {
        newState = 0
        value = 0
    }

    const response = await sendToMOTU(motu_target, value)
    if (response.ok) {
        console.log(response);
        globalSettings.datastore[motu_target] = parseInt(value)
        // If used from a MultiAction avoid changing the action state.
        if (!payload.isInMultiAction) {
            $SD.setState(
                context, 
                newState
            )
        }
    } else {
        $SD.showAlert(context)
    }
});