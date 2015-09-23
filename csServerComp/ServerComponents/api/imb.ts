//http://stackoverflow.com/questions/20606456/whats-the-recommended-way-of-creating-objects-in-nodejs
//https://gist.github.com/creationix/707146
//http://www.nodebeginner.org/
//http://nodejs.org/docs/v0.10.29/api/addons.html

const MAGIC_LO = 0x7161472F;
const MAGIC_HI = 0xFBC5AD95;

const MAGIC_PAYLOAD = 0x10F13467;

const DEFAULT_STREAM_BODY_BUFFER_SIZE = 16 * 1024;

const icHeartBeat = -4;
const icEndSession = -5;
const icFlushQueue = -6;
const icUniqueClientID = -7;
const icTimeStamp = -8;
const icEvent = -15;
const icEndClientSession = -21;
const icFlushClientQueue = -22;
const icConnectToGateway = -23;
const icSetClientInfo = -31;
const icSetVariable = -32;
const icAllVariables = -33;
const icSetState = -34;
const icSetThrottle = -35;
const icSetNoDelay = -36;
const icSetVariablePrefixed = -37;
const icRequestEventNames = -41;
const icEventNames = -42;
const icRequestSubscribers = -43;
const icRequestPublishers = -44;
const icSubscribe = -45;
const icUnsubscribe = -46;
const icPublish = -47;
const icUnpublish = -48;
const icSetEventIDTranslation = -49;
const icStatusEvent = -52;
const icStatusClient = -53;
const icStatusEventPlus = -54;
const icStatusClientPlus = -55;
const icStatusHUB = -56;
const icStatusTimer = -57;
const icHumanReadableHeader = -60;
const icSetMonitor = -61;
const icResetMonitor = -62;
const icCreateTimer = -73;
const icHUBLocate = -81;
const icHUBFound = -82;
const icLogClear = -91;
const icLogRequest = -92;
const icLogContents = -93;

const actionNew = 0;
const actionDelete = 1;
const actionChange = 2;

const ekChangeObjectEvent = 0;
const ekStreamHeader = 1;
const ekStreamBody = 2;
const ekStreamTail = 3;
const ekBuffer = 4;
const ekNormalEvent = 5;
const ekChangeObjectDataEvent = 6;
const ekChildEventAdd = 11;
const ekChildEventRemove = 12;
const ekLogWriteLn = 30;
const ekTimerCancel = 40;
const ekTimerPrepare = 41;
const ekTimerStart = 42;
const ekTimerStop = 43;
const ekTimerAcknowledgedListAdd = 45;
const ekTimerAcknowledgedListRemove = 46;
const ekTimerSetSpeed = 47;
const ekTimerTick = 48;
const ekTimerAcknowledge = 49;
const ekTimerStatusRequest = 50;

// ********************** low level wire command *******************************

function signalCommand(aSocket, aCommand, aPayload) {
    var buffer = new Buffer(20 + aPayload.length);
    // magic
    buffer.writeUInt32LE(MAGIC_LO, 0);
    buffer.writeUInt32LE(MAGIC_HI, 4);
    // command and payload size
    buffer.writeInt32LE(aCommand, 8);
    buffer.writeInt32LE(aPayload.length, 12);
    // payload
    if (aPayload.length > 0) {
        // payload and payload magic
        aPayload.copy(buffer, 16);
        buffer.writeUInt32LE(MAGIC_PAYLOAD, buffer.length - 4);
    }
    aSocket.write(buffer);
}

function signalSubscribe(aSocket, aEventID, aEventEntryType, aEventName) {
    var eventNameByteLength = Buffer.byteLength(aEventName); // default is utf8
    var payload = new Buffer(12 + eventNameByteLength);
    payload.writeInt32LE(aEventID, 0);
    payload.writeInt32LE(aEventEntryType, 4);
    payload.writeInt32LE(eventNameByteLength, 8);
    payload.write(aEventName, 12); // default is utf8
    signalCommand(aSocket, icSubscribe, payload);
}

function signalUnSubscribe(aSocket, aEventName) {
    var eventNameByteLength = Buffer.byteLength(aEventName); // default is utf8
    var payload = new Buffer(4 + eventNameByteLength);
    payload.writeInt32LE(eventNameByteLength, 0);
    payload.write(aEventName, 4); // default is utf8
    signalCommand(aSocket, icUnsubscribe, payload);
}

function signalPublish(aSocket, aEventID, aEventEntryType, aEventName) {
    var eventNameByteLength = Buffer.byteLength(aEventName); // default is utf8
    var payload = new Buffer(12 + eventNameByteLength);
    payload.writeInt32LE(aEventID, 0);
    payload.writeInt32LE(aEventEntryType, 4);
    payload.writeInt32LE(eventNameByteLength, 8);
    payload.write(aEventName, 12); // default is utf8
    signalCommand(aSocket, icPublish, payload);
}

function signalUnPublish(aSocket, aEventName) {
    var eventNameByteLength = Buffer.byteLength(aEventName); // default is utf8
    var payload = new Buffer(4 + eventNameByteLength);
    payload.writeInt32LE(eventNameByteLength, 0);
    payload.write(aEventName, 4); // default is utf8
    signalCommand(aSocket, icUnpublish, payload);
}

function signalClientInfo(aSocket, aOwnerID, aOwnerName) {
    var ownerNameByteLength = Buffer.byteLength(aOwnerName); // default is utf8
    var payload = new Buffer(8 + ownerNameByteLength);
    payload.writeInt32LE(aOwnerID, 0);
    payload.writeInt32LE(ownerNameByteLength, 4);
    payload.write(aOwnerName, 8); // default is utf8
    signalCommand(aSocket, icSetClientInfo, payload);
}

function signalChangeObject(aSocket, aEventID, aAction, aObjectID, aAttribute) {
    var attributeByteLength = Buffer.byteLength(aAttribute); // default is utf8
    var payload = new Buffer(4 + 4 + 4 + 4 + 4 + 4 + attributeByteLength);
    payload.writeInt32LE(aEventID, 0);
    payload.writeInt32LE(0, 4); // tick
    payload.writeInt32LE(ekChangeObjectEvent, 8);
    payload.writeInt32LE(aAction, 12);
    payload.writeInt32LE(aObjectID, 16);
    payload.writeInt32LE(attributeByteLength, 20);
    payload.write(aAttribute, 24);
    signalCommand(aSocket, icEvent, payload);
}

function signalNormalEvent(aSocket, aEventID, aEventKind, aEventPayload) {
    var payload = new Buffer(4 + 4 + 4 + aEventPayload.length);
    payload.writeInt32LE(aEventID, 0);
    payload.writeInt32LE(0, 4); // tick
    payload.writeInt32LE(aEventKind, 8);
    aEventPayload.copy(payload, 12);
    signalCommand(aSocket, icEvent, payload);
}

function hashCode(s) {
    return s.split("").reduce(function(a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
}

function signalStream(aSocket, aEventID, aStreamName, aStream) {
    var streamID = hashCode(aStreamName) + hashCode(aSocket.toString()); //hashCode(aSocket.remoteAddress)+hashCode(aSocket.remotePort.toString()); // todo: make more unique by using id
    // stream header
    var streamNameLength = Buffer.byteLength(aStreamName);
    var payload = new Buffer(4 + 4 + 4 + 4 + 4 + streamNameLength);
    payload.writeInt32LE(aEventID, 0);
    payload.writeInt32LE(0, 4); // tick
    payload.writeInt32LE(ekStreamHeader, 8);
    payload.writeInt32LE(streamID, 12);
    payload.writeInt32LE(streamNameLength, 16);
    payload.write(aStreamName, 20);
    signalCommand(aSocket, icEvent, payload);
    //console.log("stream start");
    aStream.on('data', function(chunk) {
        // stream body
        payload = new Buffer(4 + 4 + 4 + 4 + chunk.length);
        payload.writeInt32LE(aEventID, 0);
        payload.writeInt32LE(0, 4); // tick
        payload.writeInt32LE(ekStreamBody, 8);
        payload.writeInt32LE(streamID, 12);
        chunk.copy(payload, 16);
        signalCommand(aSocket, icEvent, payload);
        //console.log("stream body "+chunk.length.toString());
    });
    aStream.on('end', function() {
        payload = new Buffer(4 + 4 + 4 + 4);
        payload.writeInt32LE(aEventID, 0);
        payload.writeInt32LE(0, 4); // tick
        payload.writeInt32LE(ekStreamTail, 8);
        payload.writeInt32LE(streamID, 12);
        signalCommand(aSocket, icEvent, payload);
        //console.log("stream tail");
    });
}

// **************** handlers called from command reader ********************

exports.TIMBConnection = function() {
    var fSocket = require("net").Socket();

    var fEventNames = [];
    var fEventTranslations = [];
    var fEventDefinitions = [];
    var fUniqueClientID = 0;
    var fClientID = 0;
    var fFederation = "TNOdemo";

    function handleEvent(aEventID, aEventKind, aEventPayload) {
        var eventName = fEventNames[aEventID];
        var eventDefinition = fEventDefinitions[aEventID];
        var shortEventName = eventName;
        if (eventName.toUpperCase().lastIndexOf((fFederation + ".").toUpperCase(), 0) === 0) {
            shortEventName = eventName.substring(fFederation.length + 1);
        }
        else {
            shortEventName = eventName;
        }
        // todo: handle event
        switch (aEventKind) {
            case ekNormalEvent:
                if (eventDefinition.onNormalEvent !== null) {
                    eventDefinition.onNormalEvent(eventDefinition, aEventPayload);
                }
                break;
            case ekChangeObjectEvent:
                if (eventDefinition.onChangeObject !== null) {
                    var action = aEventPayload.readInt32LE(0);
                    var objectID = aEventPayload.readInt32LE(4);
                    var attributeNameSize = aEventPayload.readInt32LE(8);
                    var attributeName = aEventPayload.toString("utf8", 12, 12 + attributeNameSize);
                    eventDefinition.onChangeObject(action, objectID, shortEventName, attributeName);
                }
                break;
            case ekStreamHeader:
                if (eventDefinition.onStreamCreate != null) {
                    if (eventDefinition.streamDefinitions == null)
                        eventDefinition.streamDefinitions = {};
                    var streamID = aEventPayload.readInt32LE(0);
                    var streamNameSize = aEventPayload.readInt32LE(4);
                    var streamName = aEventPayload.toString("utf8", 8, 8 + streamNameSize);

                    var streamStream = eventDefinition.onStreamCreate(eventDefinition, streamName);
                    if (streamStream != null)
                        eventDefinition.streamDefinitions[streamID.toString()] = { ID: streamID, Name: streamName, stream: streamStream };
                }
                break;
            case ekStreamBody:
                if (eventDefinition.onStreamCreate != null) {
                    if (eventDefinition.streamDefinitions != null) {
                        var streamID = aEventPayload.readInt32LE(0);
                        var streamDefinition = eventDefinition.streamDefinitions[streamID];
                        if (streamDefinition != null)
                            streamDefinition.stream.write(aEventPayload.slice(4));
                    }
                }
                break;
            case ekStreamTail:
                if (eventDefinition.onStreamCreate != null) {
                    if (eventDefinition.streamDefinitions != null) {
                        var streamID = aEventPayload.readInt32LE(0);
                        var streamDefinition = eventDefinition.streamDefinitions[streamID];
                        if (streamDefinition != null) {
                            if (aEventPayload.length > 4)
                                streamDefinition.stream.end(aEventPayload.slice(4, aEventPayload.length));
                            else
                                streamDefinition.stream.end();
                            if (eventDefinition.onStreamEnd != null)
                                eventDefinition.onStreamEnd(eventDefinition, streamDefinition.stream, streamDefinition.streamName);
                            eventDefinition.streamDefinitions[streamID] = null;
                        }
                    }
                }
                break;
        }
    }

    function handleEndSession() {
        // todo: handle end of session received from hub
    }

    function handleCommand(aCommand, aPayload) {
        var rxEventID;
        var txEventID;
        switch (aCommand) {
            case icEndSession: // end session
                handleEndSession();
                break;
            case icUniqueClientID: // unique client id
                fUniqueClientID = aPayload.readUInt32LE(0);
                fClientID = aPayload.readUInt32LE(4);
                break;
            case icEvent: // event
                txEventID = aPayload.readInt32LE(0);
                if (txEventID < fEventTranslations.length) {
                    rxEventID = fEventTranslations[txEventID];
                    var tick = aPayload.readUInt32LE(4);
                    var eventDef = aPayload.readUInt32LE(8);
                    var eventPayload = new Buffer(aPayload.length - 12);
                    // todo: could probably use slice
                    aPayload.copy(eventPayload, 0, 12, aPayload.length);
                    handleEvent(rxEventID, eventDef, eventPayload);
                }
                else {
                    console.log("## received invalid event id " + txEventID.toString());
                }
                break;
            //case -32:; // set variable
            //	break;
            //case -37:; // set variable prefixed
            //	break;
            case icSetEventIDTranslation:
                txEventID = aPayload.readInt32LE(0);
                rxEventID = aPayload.readInt32LE(4);
                // check and make room for event id
                if (txEventID >= fEventTranslations.length) {
                    var preLength = fEventTranslations.length;
                    fEventTranslations.length = txEventID + 1;
                    for (var i = preLength; i < fEventTranslations.length - 1; i++) {
                        fEventTranslations[i] = -1;
                    }

                }
                fEventTranslations[txEventID] = rxEventID;
                break;
        }
    }

    var fBuffer = new Buffer(0);

    function onReadCommand(aNewData) {
        fBuffer = Buffer.concat([fBuffer, aNewData], fBuffer.length + aNewData.length);
        var offset = 0;
        while (offset <= fBuffer.length - 16) // 16 is minimum packet size (fixed header size)
        {
            var ml = fBuffer.readUInt32LE(offset);
            var mh = fBuffer.readUInt32LE(offset + 4);
            if (ml === MAGIC_LO && mh === MAGIC_HI) {
                offset += 8;
                var command = fBuffer.readInt32LE(offset);
                var payloadSize = fBuffer.readUInt32LE(offset + 4);
                offset += 8;
                if (payloadSize > 0) {
                    // check if we have enough data in the buffer to completely read command else break and retry in next data event
                    if (fBuffer.length - offset < payloadSize + 4) {
                        // reset offset to start of packet
                        offset -= 8 + 8
                        break;
                    }
                    // we can safely read the data
                    var payload = new Buffer(payloadSize);
                    fBuffer.copy(payload, 0, offset, offset + payloadSize);
                    offset += payloadSize;
                    if (fBuffer.readUInt32LE(offset) === MAGIC_PAYLOAD) {
                        handleCommand(command, payload);
                    }
                    else {
                        console.log("## payload (" + payloadSize.toString() + ") not OK for " + command.toString());
                    }
                    offset += 4;
                }
                else {
                    handleCommand(command, new Buffer(0));
                }
            }
            else {
                offset++;
                console.log("## invalid magic: " + ml.toString(16) + mh.toString(16));
            }
        }
        // remove processed data (all up to, and including, offset)
        if (offset !== 0) {
            if (offset < fBuffer.length) {
                //fBuffer.copy(fBuffer, 0, offset, fBuffer.length);
                var newBuffer = new Buffer(fBuffer.length - offset);
                fBuffer.copy(newBuffer, 0, offset, fBuffer.length);
                fBuffer = newBuffer;
            }
            else {
                fBuffer.length = 0;
            }
        }
    }

    function onDisconnect() {
        // todo:
    }

    function EventDefinition(aEventID, aEventName) {
        // define event
        this.name = aEventName;
        this.id = aEventID;
        this.subscribed = false;
        this.published = false;
        this.onChangeObject = null;
        this.onNormalEvent = null;
        this.onStreamCreate = null;
        this.onStreamEnd = null;
        //this.onBuffer = null;
        this./*prototype.*/changeObject = function(aAction, aObjectID, aAttribute) {
            if (!this.published) {
                signalPublish(fSocket, this.id, 0, this.name);
                this.published = true;
            }
            signalChangeObject(fSocket, this.id, aAction, aObjectID, aAttribute);
        };

        this./*prototype.*/normalEvent = function(aEventKind, aEventPayload) {
            if (!this.published) {
                signalPublish(fSocket, this.id, 0, this.name);
                this.published = true;
            }
            signalNormalEvent(fSocket, this.id, aEventKind, aEventPayload);
        };

        this.stream = function(aStreamName, aStream) {
            if (!this.published) {
                signalPublish(fSocket, this.id, 0, this.name);
                this.published = true;
            }
            signalStream(fSocket, this.id, aStreamName, aStream);
        }
    }

    function addOrSetEvent(aEventName) {
        var eventID = fEventNames.indexOf(aEventName);
        if (eventID < 0) {
            eventID = fEventNames.push(aEventName) - 1;
            if (fEventDefinitions.length < eventID + 1) {
                fEventDefinitions.length = eventID + 1;
            }
            // store this
            fEventDefinitions[eventID] = new EventDefinition(eventID, aEventName);
        }
        return eventID;
    }

    this.connect = function(aRemoteHost, aRemotePort, aOwnerID, aOwnerName, aFederation) {
        fFederation = aFederation;
        // connect
        fSocket.connect(aRemotePort, aRemoteHost);
        // link handlers
        fSocket.on("data", onReadCommand);
        fSocket.on("end", onDisconnect);
        // send client info
        signalClientInfo(fSocket, aOwnerID, aOwnerName);
    };

    this.disconnect = function() {
        fSocket.end();
    };

    this.subscribe = function(aEventName, aUsePrefix) {
        if (aUsePrefix) {
            aEventName = fFederation + "." + aEventName;
        }
        var eventID = addOrSetEvent(aEventName);
        var eventDefinition = fEventDefinitions[eventID];
        signalSubscribe(fSocket, eventID, 0, aEventName);
        eventDefinition.subscribed = true;
        return eventDefinition;
    };

    this.unSubscribe = function(aEventName, aUsePrefix) {
        if (aUsePrefix) {
            aEventName = fFederation + "." + aEventName;
        }
        var eventID = fEventNames.indexOf(aEventName);
        if (eventID >= 0) {
            var eventDefinition = fEventDefinitions[eventID];
            signalUnSubscribe(fSocket, aEventName);
            eventDefinition.subscribed = false;
            return eventDefinition;
        }
        else {
            return null;
        }
    };

    this.publish = function(aEventName, aUsePrefix) {
        if (aUsePrefix) {
            aEventName = fFederation + "." + aEventName;
        }
        var eventID = addOrSetEvent(aEventName);
        var eventDefinition = fEventDefinitions[eventID];
        signalPublish(fSocket, eventID, 0, aEventName);
        eventDefinition.published = true;
        return eventDefinition;
    };

    this.unPublish = function(aEventName, aUsePrefix) {
        if (aUsePrefix) {
            aEventName = fFederation + "." + aEventName;
        }
        var eventID = fEventNames.indexOf(aEventName);
        if (eventID >= 0) {
            var eventDefinition = fEventDefinitions[eventID];
            signalUnPublish(fSocket, aEventName);
            eventDefinition.published = false;
            return eventDefinition;
        }
        else {
            return null;
        }
    };
};


// exports for consts
exports.actionNew = actionNew;
exports.actionDelete = actionDelete;
exports.actionChange = actionChange;

exports.ekChangeObjectEvent = ekChangeObjectEvent;
exports.ekNormalEvent = ekNormalEvent;
