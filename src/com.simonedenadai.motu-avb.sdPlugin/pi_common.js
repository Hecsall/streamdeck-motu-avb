

function piApiSettings() {
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
                            // If the URL is working we save it
                            $PI.setGlobalSettings({
                                [apiUrl.id]: apiUrl.value
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
                            alert(`The URL is not working, a quick check returned a status ${response.status}`)
                        }
                })

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