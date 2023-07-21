/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />
/// <reference path="../../../pi_common.js" />

$PI.onConnected((jsn) => {
    console.log("Properties Inspector onConnected");
    $PI.getGlobalSettings();
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;
    
    if (!settings) {
        $PI.setSettings({ 'motu_target': 'mix/reverb/0/reverb/enable' });
    }

    // Set of common operations for all actions 
    // to handle the API URL input
    piApiSettings();
});