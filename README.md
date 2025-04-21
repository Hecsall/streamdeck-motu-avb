# MOTU AVB Plugin for StreamDeck (Unofficial)

This StreamDeck Plugin allows you to change parameters on your MOTU audio interface over API.
Only interfaces that are compatible with the [MOTU AVB Datastore API](https://cdn-data.motu.com/downloads/audio/AVB/docs/MOTU%20AVB%20Web%20API.pdf) will work.

![MOTU AVB StreamDeck Plugin](preview.png)

## Actions

**Toggle ON/OFF** [ 0 &rarr; 1 &rarr; 0 ] \
Switches an endpoint between 0 and 1, useful for Mute, Solo, and other UI elements that can be switched on and off;

**Toggle Values** [ X &rarr; Y &rarr; X ] \
Switches an endpoint between 2 user-defined values, useful if you need to jump between 2 different dB values on faders, for example;

**Set Value** [ &rarr; X ] \
This will set an endpoint to a specific value, this is a single press action, not a toggle;

## Development

Using `Node 20.19.0`:

- `npm install -g @elgato/cli`
- `npm install`
- `streamdeck link com.simonedenadai.motu-avb.sdPlugin`
- `npm run watch`

---

> **Disclaimer**
    All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
