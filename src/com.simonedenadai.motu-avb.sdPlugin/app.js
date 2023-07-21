/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const muteAction = new Action('com.simonedenadai.motu-avb.mute');
let muteActions = {}

const soloAction = new Action('com.simonedenadai.motu-avb.solo');
let soloActions = {}

const reverbAction = new Action('com.simonedenadai.motu-avb.reverb');
let reverbActions = {}

const generic_boolAction = new Action('com.simonedenadai.motu-avb.generic_bool');
let generic_boolActions = {}


let globalSettings = {};
let needsReFetch = true;


async function setBooleanActionState(actionsObject) {
    Object.keys(actionsObject).forEach(async (uuid) => {
        const action = actionsObject[uuid]
        const response = await fetch(`${globalSettings.api_url}/${action.payload.settings.motu_target}`).then((response) => response.json());
        
        if (response.value === 1) {
            $SD.setState(uuid, 1)
        } else {
            $SD.setState(uuid, 0)
        }
    })
}

// async function subscribeMotu() {
//     let response = await fetch("/subscribe");
  
//     if (response.status == 502) {
//         // Status 502 is a connection timeout error,
//         // may happen when the connection was pending for too long,
//         // and the remote server or a proxy closed it
//         // let's reconnect
//         await subscribeMotu();
//     } else if (response.status != 200) {
//         // An error - let's show it
//         showMessage(response.statusText);
//         // Reconnect in one second
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         await subscribeMotu();
//     } else {
//         // Get and show the message
//         let message = await response.text();
//         showMessage(message);
//         // Call subscribeMotu() again to get the next message
//         await subscribeMotu();
//     }
// }


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
            
            // XXX: Add here new Boolean actions
            // Update state for Boolean actions (value 0 or 1)
            [muteActions, soloActions, reverbActions, generic_boolActions].forEach(async (actions) => {
                await setBooleanActionState(actions);
            })
            
            // XXX: Add here new Numerical actions
            // Update state for Numerical actions
            // [].forEach(async (actions) => {
            //     await setNumericalActionState(actions);
            // })
        }
        console.log('cached global settings', globalSettings);
    }
    else {
        console.log('unable to cache global settings; payload.settings field not found');
    }
})


// On willAppear, store used actions inside their respective collection for later use
muteAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    muteActions[context] = { action, device, event, payload };
});

soloAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    soloActions[context] = { action, device, event, payload };
});

reverbAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    reverbActions[context] = { action, device, event, payload };
});

generic_boolAction.onWillAppear(async ({ action, context, device, event, payload }) => {
    generic_boolActions[context] = { action, device, event, payload };
});


// XXX: Add here all "Boolean" actions to be handled the same way
[
    muteAction,
    soloAction,
    reverbAction,
    generic_boolAction
].forEach((action) => {
    action.onKeyUp(async ({ action, context, device, event, payload }) => {
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
});