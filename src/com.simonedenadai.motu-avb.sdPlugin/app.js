/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const muteAction = new Action('com.simonedenadai.motu-avb.mute');

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
});


muteAction.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('Your key code goes heree!');
	console.log({ action, context, device, event, payload })
});
