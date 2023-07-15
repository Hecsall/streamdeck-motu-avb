# Stream Deck MOTU AVB Plugin

MOTU AVB Audio Interface Plugin for Stream Deck

## Development

- Clone this repo using the --recurse-submodules flag

    ```sh
    git clone --recurse-submodules https://github.com/Hecsall/streamdeck-motu-avb.git
    ```

- From the project root folder, create a symlink to Stream Deck Plugins folder.

    ### **macOS**

    ```sh
    ln -s $(pwd)/src/com.simonedenadai.motu-avb.sdPlugin ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
    ```

    ### **Windows**

    ```sh
    # Works only from Command Prompt
    mklink /D C:\Users\%USERNAME%\AppData\Roaming\Elgato\StreamDeck\Plugins\com.simonedenadai.motu-avb.sdPlugin %cd%\src\com.simonedenadai.motu-avb.sdPlugin
    ```
- Enable Stream Deck Debugging mode

    ### **macOS**
    ```sh
    defaults write com.elgato.StreamDeck html_remote_debugging_enabled -bool YES
    ```

    ### **Windows**
    Add a DWORD `html_remote_debugging_enabled` with value `1` in the registry `@HKEY_CURRENT_USER\Software\Elgato Systems GmbH\StreamDeck`

- Close and reopen the Stream Deck software then open [http://localhost:23654/](http://localhost:23654/) on your browser.