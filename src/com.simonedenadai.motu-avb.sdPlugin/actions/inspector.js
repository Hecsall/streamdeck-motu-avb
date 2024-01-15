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

        const listElement = document.querySelector('#motu_targets');
        possibleChannels.sort().forEach((element) => {
            const item = document.createElement('li');
            item.innerText = element;
            if (actionSettings.motu_target && actionSettings.motu_target === element) {
                item.classList.add('selected');
            }
            listElement.appendChild(item);
        });

        // Center the selected item on UI refresh to make it visible
        document.querySelector('#motu_targets li.selected')?.scrollIntoView({
            behavior: 'instant', 
            block: 'center'
        });

        const onItemClick = (item) => {
            allItems.forEach((item) => {
                item.classList.remove('selected');
            });
            item.classList.add('selected');
            selectElement.value = item.innerText;
            const form = document.querySelector('#configuration');
            form.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Attach onClick event to all items to make them selectable
        const allItems = document.querySelectorAll('#motu_targets li');
        allItems.forEach((item) => {
            item.addEventListener('click', () => onItemClick(item));
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
            console.log('inspector form input detected')
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

    const searchTargetInput = document.querySelector('#search_motu_targets');
    const motuTargetsList = document.querySelector('#motu_targets');

    // Handle search input
    searchTargetInput.addEventListener('keyup', () => {
        const searchTerm = searchTargetInput.value.toUpperCase();
        const li = motuTargetsList.getElementsByTagName('li');

        if (searchTerm === "") {
            for (let i = 0; i < li.length; i++) {
                li[i].style.display = "";
            }
            return;
        }

        // TODO: refactor loop as a forEach
        for (let i = 0; i < li.length; i++) {
            item = li[i];
            const txtValue = item.innerText;
            if (txtValue.toUpperCase().indexOf(searchTerm) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    })



    // When receiving global settings, update the UI with those values
    $PI.onDidReceiveGlobalSettings((data) => {
        updateUI(data.payload?.settings, settings);
    });
});
