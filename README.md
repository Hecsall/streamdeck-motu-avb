# Stream Deck MOTU AVB Plugin

MOTU AVB Audio Interface Plugin for Stream Deck (Unofficial)

## Available Actions

**Toggle On/Off** [ 0 &rarr; 1 &rarr; 0 ] \
Switches a channel between 0 and 1, useful for Mute, Solo, and other UI elements that can be switched on;

**Toggle Values** [ X &rarr; Y &rarr; X ] \
Switches a channel between 2 user-defined values, useful if you need to jump between 2 different dB values on faders;

**Set Value** [ &rarr; X ] \
This will set a channel to a specific value, this is a single press action, not a toggle;

## Development

- Clone this repo using the --recurse-submodules flag

    ```sh
    git clone --recurse-submodules https://github.com/Hecsall/streamdeck-motu-avb.git
    ```

- From the project root folder, create a symlink to Stream Deck Plugins folder.

    **macOS**

    ```sh
    ln -s $(pwd)/src/com.simonedenadai.motu-avb.sdPlugin ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
    ```

    **Windows**

    ```sh
    # Works only from Command Prompt
    mklink /D C:\Users\%USERNAME%\AppData\Roaming\Elgato\StreamDeck\Plugins\com.simonedenadai.motu-avb.sdPlugin %cd%\src\com.simonedenadai.motu-avb.sdPlugin
    ```

- (Optional) Run `npm install` to install eslint for code style and formatting

- Enable Stream Deck Debugging mode

    **macOS**

    ```sh
    defaults write com.elgato.StreamDeck html_remote_debugging_enabled -bool YES
    ```

    **Windows**
    Add a DWORD `html_remote_debugging_enabled` with value `1` in the registry `@HKEY_CURRENT_USER\Software\Elgato Systems GmbH\StreamDeck`

- Close and reopen the Stream Deck software then open [http://localhost:23654/](http://localhost:23654/) on your browser.

> **Disclaimer**
    All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.