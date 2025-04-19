# MOTU AVB Plugin for StreamDeck

This StreamDeck Plugin allows you to change parameters on your MOTU audio interface over API.
Only interfaces that are compatible with the [MOTU AVB Datastore API](https://cdn-data.motu.com/downloads/audio/AVB/docs/MOTU%20AVB%20Web%20API.pdf) will work.

## Development

Using `Node 20.19.0`:

- `npm install -g @elgato/cli`
- `npm install`
- `streamdeck link com.simonedenadai.motu-avb-canary.sdPlugin`
- `npm run watch`

## TODO

- Filter datastore values
- Enhance Property inspector UI and endpoint setting field
- `ToggleValues` Action
- `SetValue` Action
- Cleanup trace logs (also set a different loglevel)
- Rename from `motu-avb-canary` to `motu-avb`

> **Disclaimer**
    All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
