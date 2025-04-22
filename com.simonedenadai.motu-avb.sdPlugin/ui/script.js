const { streamDeckClient } = SDPIComponents;

const connectionForm = document.getElementById('connection-form');
const motuUrlInput = document.getElementById('motuUrl');
const connectionButton = document.getElementById('connection-button');

// Help buttons hide/show logic
const helpButtons = document.querySelectorAll('.help-button');
helpButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const helpText = button.nextElementSibling;
        if (helpText.style.display === 'none') {
            helpText.style.display = 'block';
        }
        else {
            helpText.style.display = 'none';
        }
    }
    );
});

streamDeckClient.getGlobalSettings().then((globalSettings) => {
    console.log(globalSettings);
   
    // Populate the motuUrl input field with the saved URL
    if (globalSettings.motuUrl) {
        motuUrlInput.value = globalSettings.motuUrl;
    }

    // Handle connection

    // Can't pass type="submit" to the button, so I have to do this...
    connectionButton.addEventListener('click', (_event) => {
        connectionForm.dispatchEvent(new Event('submit'));
    });

    connectionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const motuUrl = document.getElementById('motuUrl').value;
        
        if (motuUrl) {
            connectionButton.textContent = 'Connecting...';

            fetch(motuUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => {
                if (response.ok) {
                    response.json().then((json) => {
                        if (json.uid) {
                            console.log(`Connected to MOTU AVB API at ${motuUrl}`);
                            const cleanedUrl = motuUrl.replace(/\/+$/, "")
                            streamDeckClient.setGlobalSettings({ ...globalSettings, motuUrl: cleanedUrl });
                            motuUrlInput.classList.remove('invalid');
                            motuUrlInput.classList.add('valid');

                            // Wait 1.5s then refresh the enpoint input to get the updated datastore endpoints
                            setTimeout(() => {
                                document.querySelector('#endpoint').refresh();
                            }, 1500);
                            return
                        }
                    });
                }

                throw new Error('Invalid response from MOTU API');
            }).catch((error) => {
                motuUrlInput.classList.add('invalid');
                motuUrlInput.classList.remove('valid');
                console.error(error);
            }).finally(() => {
                connectionButton.textContent = 'Connect';
            })
        } else {
            motuUrlInput.classList.add('invalid');
            motuUrlInput.classList.remove('valid');
            console.error('Please enter a valid MOTU AVB API URL');
        }
    });

});