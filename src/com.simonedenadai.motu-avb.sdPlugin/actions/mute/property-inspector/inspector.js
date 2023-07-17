/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />
/// <reference path="../../../pi_common.js" />

$PI.onConnected((jsn) => {
    console.log("Properties Inspector onConnected");
    $PI.getGlobalSettings();
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    // Populate the form with this action's settings
    const form = document.querySelector('#property-inspector');   
    Utils.setFormValue(settings, form);

    // When fields change inside the form,
    // Save their values to the action settings
    form.addEventListener(
        'input',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);
            $PI.setSettings(value);
        })
    );
    
    // Set of common operations for all actions 
    // to handle the API URL input
    piApiSettings();
});


const updateUI = (settings) => {
    if (settings.datastore) {
        const possibleMuteChannels = Object.keys(settings.datastore).filter((key) => key.endsWith('/mute'));
        const selectElement = document.querySelector('#motu_target');
        possibleMuteChannels.forEach((element) => {
            const option = document.createElement('option');
            option.value = element;
            option.text = element;
            selectElement.appendChild(option);
        })
    }

    Object.keys(settings).map(key => {
        if (key && (key != '' || key != 'datastore')) {
            const foundElement = document.querySelector(`#${key}`);
            if (foundElement) {
                foundElement.value = settings[key];
            }
        }
   })
}

/**
 * Provide window level functions to use in the external window
 * (this can be removed if the external window is not used)
 */
// window.sendToInspector = (data) => {
//     console.log(data);
// };

// document.querySelector('#open-external').addEventListener('click', () => {
//     window.open('../../../external.html');
// });



// $PI.sendToPlugin({ 
//     key: apiUrl.id,
//     value: value
// })