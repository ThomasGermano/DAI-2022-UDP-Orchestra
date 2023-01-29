const net = require('net');
const dgram = require('dgram');

// charge le fichier de configuration
const config = require('./config.json');

// array to store active musicians
let activeMusicians = [];

const checkActiveMusician = (musician) => {
    const now = new Date();
    const activeSince = new Date(musician.lastActive);
    return (now - activeSince) <= 5000;
};

const removeInactiveMusicians = () => {
    console.log(activeMusicians);
    console.log('Removing inactive musicians');
    activeMusicians = activeMusicians.filter(checkActiveMusician);
}

// check each 5 seconds if musicians are still active
setInterval(removeInactiveMusicians, config['keep-active-timeout']);

// create a UDP socket
const socket = dgram.createSocket('udp4');

// listen to the multicast group
socket.bind(config["multicast-port"], () => {
    socket.addMembership(config['multicast-group']);
});

// listen to the socket
socket.on('message', (msg, source) => {
    const musician = JSON.parse(msg);
    console.log(musician);
    const musicianIndex = activeMusicians.findIndex(m => m.uuid_musician === musician.uuid_musician);

    if (musicianIndex === -1) {
        musician.instrument = config['sounds'][musician.sound];
        musician.lastActive = Date.now();
        delete musician.sound;
        activeMusicians.push(musician);
    } else {
        activeMusicians[musicianIndex].lastActive = Date.now();
    }
    console.log(activeMusicians);
});

// create a TCP server
const tcpServer = net.createServer();

// listen to the server
tcpServer.on('connection', (socket) => {
    console.log('New connection');
    removeInactiveMusicians();
    socket.write(JSON.stringify(activeMusicians));
    socket.end();
});

// listen to the server
tcpServer.listen(config['tcp-port'], () => {
    console.log('TCP server listening on port ' + config['tcp-port']);
});