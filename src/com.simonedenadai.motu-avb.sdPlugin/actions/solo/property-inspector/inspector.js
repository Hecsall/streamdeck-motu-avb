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

    // Used inside piApiSettigns to find which MOTU channels to display inside the UI
    window.selectableRegex = /(.*)\/solo$/;

    // Set of common operations for all actions 
    // to handle the API URL input
    piApiSettings();
});