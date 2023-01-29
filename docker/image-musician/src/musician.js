const dgram = require('dgram');
const uuid = require('uuid');

// charge le fichier de configuration
const config = require('./config.json');

const instrument = process.argv[2];
const sound = config['instruments'][instrument];
const uuid_mus = uuid.v4();
const socket = dgram.createSocket('udp4');

const musicianData = {};

musicianData.uuid_musician = uuid_mus;
musicianData.sound = sound;

const message = JSON.stringify(musicianData);

const buffer = new Buffer.from(message);

function play()  {
    // envoie le message en multicast UDP
    socket.send(buffer, 0, buffer.length, config['multicast-port'], config['multicast-group'], (err) => {
        if (err) {
            console.log(err);
        }
    })

    console.log("Sending payload: " + message);
}

// joue toutes les secondes
setInterval(play, config['interval'])