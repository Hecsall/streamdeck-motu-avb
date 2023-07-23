/// <reference path="../libs/js/property-inspector.js" />
/// <reference path="../libs/js/utils.js" />


const updateUI = (globalSettings, actionSettings) => {
    if (globalSettings.datastore && window.selectableRegex) {
        const possibleChannels = Object.keys(globalSettings.datastore).filter((key) => window.selectableRegex.test(key));
        
        const selectElement = document.querySelector('#motu_target');
        possibleChannels.sort().forEach((element) => {
            const option = document.createElement('option');
            option.value = element;
            option.text = element;
            if (actionSettings.motu_target && actionSettings.motu_target === element) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        })
    }

    Object.keys(globalSettings).map(key => {
        if (key && (key != '' || key != 'datastore' || key != 'datastoreUpdatedAt')) {
            const foundElement = document.querySelector(`#${key}`);
            if (foundElement) {
                foundElement.value = globalSettings[key];
            }
        }
   })
}


$PI.onConnected((jsn) => {
    console.log("Properties Inspector onConnected");
    $PI.getGlobalSettings();

    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

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
            console.log(value);
            $PI.setSettings(value);
        })
    );

    // piApiSettings will use this to regex to select 
    // which MOTU channels to display inside the UI
    if (actionInfo.action === 'com.simonedenadai.motu-avb.toggleonoff') {
        // For boolean options MOTU accepts only 0 or 1
        window.selectableRegex = /^mix\/(.*)\/(.*)\/(.*)\/(send|enable|mute|solo)$/;
    } else {
        // TODO: check if there are other values to be included in the regex
        window.selectableRegex = /^mix\/(.*)\/(.*)\/(.*)\/(send|fader)$/;
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
                fetch(api_url.value).then((response) => {
                    switch (response.status) {
                        case 200:
                            // If the URL is working we save it and we save the datastore
                            $PI.setGlobalSettings({
                                [apiUrl.id]: apiUrl.value,
                                datastore: response.json(),
                                datastoreUpdatedAt: new Date(),
                            });
                            apiUrl.classList.add('validated');
                            break;
                        default:
                            // If the URL is not working we show an alert and remove
                            // the old saved api_url
                            $PI.setGlobalSettings({
                                [apiUrl.id]: null
                            });
                            apiUrl.classList.remove('validated');
                            alert(`The URL is not working, a quick check returned a status ${response.status}`);
                        }
                });

                $PI.setGlobalSettings({
                    [apiUrl.id]: apiUrl.value
                })
            } else {
                alert("The API URL must be a valid URL");
            }
        })
    )

    // When receiving global settings, update the UI with those values
    $PI.onDidReceiveGlobalSettings(({payload}) => {
        updateUI(payload?.settings, settings);
    })
});