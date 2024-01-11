/* eslint-disable no-alert */
/// <reference path="../libs/js/property-inspector.js" />
/// <reference path="../libs/js/utils.js" />


const updateUI = (globalSettings, actionSettings) => {
    if (globalSettings.datastore && window.selectableRegex) {
        const datastoreKeys = Object.keys(globalSettings.datastore);
        const possibleChannels = datastoreKeys.filter((key) => window.selectableRegex.test(key));

        const selectElement = document.querySelector('#motu_target');
        possibleChannels.sort().forEach((element) => {
            const option = document.createElement('option');
            option.value = element;
            option.text = element;
            if (actionSettings.motu_target && actionSettings.motu_target === element) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    Object.keys(globalSettings).forEach((key) => {
        if (key && (key !== '' || key !== 'datastore' || key !== 'datastoreUpdatedAt')) {
            const foundElement = document.querySelector(`#${key}`);
            if (foundElement) {
                foundElement.value = globalSettings[key];
            }
        }
    });
};


/**
 * Property inspector connected
 * {actionInfo, appInfo, connection, messageType, port, uuid}
 */
$PI.onConnected((jsn) => {
    $PI.getGlobalSettings();

    const { actionInfo } = jsn;
    const { payload } = actionInfo;
    const { settings } = payload;

    const offInputItem = document.querySelector('#off-input-item');
    const onInputItem = document.querySelector('#on-input-item');
    const setInputItem = document.querySelector('#set-input-item');
    const valuesHelpItem = document.querySelector('#values-help-item');

    // Toggle On/Off action has hidden start/end values, always set to 0 and 1
    // Other actions can set custom start/end values
    if (actionInfo.action === 'com.simonedenadai.motu-avb.togglevalues') {
        offInputItem.classList.remove('hide');
        onInputItem.classList.remove('hide');
        valuesHelpItem.classList.remove('hide');
    } else if (actionInfo.action === 'com.simonedenadai.motu-avb.setvalue') {
        setInputItem.classList.remove('hide');
        valuesHelpItem.classList.remove('hide');
    }

    // Populate form with this action's settings
    const form = document.querySelector('#configuration');
    Utils.setFormValue(settings, form);

    // When fields change inside the form,
    // Save their values to the action settings
    form.addEventListener(
        'input',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);
            $PI.setSettings(value);
        }),
    );

    const BOOLEAN_CHANNELS = ["send", "enable", "mute", "solo", "makeup"]
    const ALL_CHANNELS = [...BOOLEAN_CHANNELS, "fader", "ratio", "threshold", "trim", "release", "attack"]

    // piApiSettings will use this to regex to select
    // which MOTU channels to display inside the UI
    if (actionInfo.action === 'com.simonedenadai.motu-avb.toggleonoff') {
        // For boolean options MOTU accepts only 0 or 1
        window.selectableRegex = new RegExp(`^mix\/(.*)\/(.*)\/(.*)\/(${BOOLEAN_CHANNELS.join('|')})$`);
    } else {
        // TODO: check if there are other values to be included in the regex
        window.selectableRegex = new RegExp(`^mix\/(.*)\/(.*)\/(.*)\/(${ALL_CHANNELS.join('|')})$`);
    }


    // API settings below -----

    const apiUrl = document.querySelector('#api_url');
    const apiSaveButton = document.querySelector('#api_save_button');

    // On click on Connect Button, save the
    // MOTU API URL to global settings
    apiSaveButton.addEventListener(
        'click',
        Utils.debounce(150, () => {
            if (apiUrl.checkValidity()) {
                axios.get(apiUrl.value, { timeout: 1000 })
                    .then((response) => {
                        switch (response.status) {
                        case 200:
                            // If the URL is working we save it and we save the datastore
                            $PI.setGlobalSettings({
                                [apiUrl.id]: apiUrl.value,
                                datastore: response.data,
                                datastoreUpdatedAt: new Date(),
                            });
                            apiUrl.classList.add('validated');
                            break;
                        default:
                            // If the URL is not working we show an alert and remove
                            // the old saved api_url
                            $PI.setGlobalSettings({
                                [apiUrl.id]: null,
                            });
                            apiUrl.classList.remove('validated');
                            alert(`The URL is not working, a quick check returned a status ${response.status}`);
                        }
                    });

                $PI.setGlobalSettings({
                    [apiUrl.id]: apiUrl.value,
                });
            } else {
                alert('The API URL must be a valid URL');
            }
        }),
    );

    // When receiving global settings, update the UI with those values
    $PI.onDidReceiveGlobalSettings((data) => {
        updateUI(data.payload?.settings, settings);
    });
});
