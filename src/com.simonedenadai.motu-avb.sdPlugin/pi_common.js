

function piApiSettings() {
    const apiUrl = document.querySelector('#api_url');
    const apiSaveButton = document.querySelector('#api_save_button');

    // On click on Connect Button, save the 
    // MOTU API URL to global settings
    apiSaveButton.addEventListener(
        'click',
        Utils.debounce(150, () => {
            if (apiUrl.checkValidity()) {
                $PI.setGlobalSettings({
                    [apiUrl.id]: apiUrl.value
                })
            } else {
                alert("The API URL must be a valid URL")
            }
        })
    )

    // When receiving global settings, update the UI with those values
    $PI.onDidReceiveGlobalSettings(({payload}) => {
        updateUI(payload?.settings);
    })
}