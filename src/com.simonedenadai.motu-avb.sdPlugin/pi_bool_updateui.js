const updateUI = (settings) => {
    if (settings.datastore && (window.selectableRegex)) {
        const possibleChannels = Object.keys(settings.datastore).filter((key) => window.selectableRegex.test(key));
        
        const selectElement = document.querySelector('#motu_target');
        possibleChannels.sort().forEach((element) => {
            const option = document.createElement('option');
            option.value = element;
            option.text = element;
            selectElement.appendChild(option);
        })
    }

    Object.keys(settings).map(key => {
        if (key && (key != '' || key != 'datastore' || key != 'datastoreUpdatedAt')) {
            const foundElement = document.querySelector(`#${key}`);
            if (foundElement) {
                foundElement.value = settings[key];
            }
        }
   })
}