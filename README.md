# Stream Deck MOTU AVB Plugin

MOTU AVB Audio Interface Plugin for Stream Deck

## Development

- From the project root folder, create a symlink to Stream Deck Plugins folder.

    **macOS**

    ```sh
    ln -s $(pwd)/src/com.simonedenadai.motu-avb.sdPlugin ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
    ```

    **Windows**

    ```sh
    # Git Bash
    ln -s $(pwd)/src/com.simonedenadai.motu-avb.sdPlugin C:/Users/$USERNAME/AppData/Roaming/Elgato/StreamDeck/Plugins/
    ```

    ```sh
    # Command Prompt
    mklink /D C:\Users\%USER%\AppData\Roaming\Elgato\StreamDeck\Plugins src\com.simonedenadai.motu-av.sdPlugin
    ```

- Close and reopen the Stream Deck software then open [http://localhost:23654/](http://localhost:23654/) on your browser.