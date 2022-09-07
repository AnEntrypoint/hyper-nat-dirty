const DHT = require("@hyperswarm/dht");
const pump = require("pump");
const node = new DHT({});
var net = require("net");
const udp = require('dgram');
const options = require('./options.json');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function generateUID() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}
const relay = async () => {
    console.log('starting node');
    const node = new DHT({});
    await node.ready();
    return {
        tcp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
                server.on("connection", function (servsock) {
                    console.log('new connextion, relaying to ' + port);
                    var socket = net.connect(port, host);
                    pump(servsock, socket, servsock);
                });

                server.listen(keyPair);
                return keyPair.publicKey;
            },
            client: async (publicKey, port) => {
                var server = net.createServer(function (local) {
                    console.log('connecting to', publicKey.toString('hex'));
                    const socket = node.connect(publicKey);
                    pump(local, socket, local);
                });
                server.listen(port, "127.0.0.1");
                console.log('connected');
                return publicKey;
            }
        },
        udp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
                await server.listen(keyPair);
                server.on("connection", function (conn) {
                    console.log('new connection, relaying to ' + port);
                    var client = udp.createSocket('udp4');
                    client.connect(port, host);
                    client.on('message', (buf) => {
                        conn.rawStream.send(buf);
                    })
                    conn.rawStream.on('message', function (buf) {
                        client.send(buf);
                    })
                });
            },
            client: async (publicKey, port) => {
                console.log('connecting to', publicKey.toString('hex'));
                const conn = await node.connect(publicKey);
                await new Promise(res => conn.on('open', res));
                console.log('connection open');
                var server = udp.createSocket('udp4');
                let inport;
                server.on('message', async (buf, rinfo) => {
                    if (!inport) {
                        console.log('setting port', rinfo);
                        inport = rinfo.port;
                    }
                    conn.rawStream.send(buf);
                })
                conn.rawStream.on('message', (buf) => {
                    server.send(buf, inport);
                })
                server.bind(port);
                console.log('connected, listening on UDP ', port);
            }
        }
    }
}

const schema = options.schema;
let servseed;
let clientseed;
const modes = {
    client: async (proto, port, serverport) => {
        if (!clientseed) clientseed = await new Promise(res => rl.question('ENTER SEED (FROM THE OTHER PERSON) ', res));
        const rel = await relay();
        const publicKey = DHT.keyPair(DHT.hash(Buffer.from('forward' + clientseed + proto + serverport))).publicKey;
        return (rel)[proto].client(publicKey, port);
    },
    server: async (proto, port, host) => {
        if (!servseed) {
            servseed = generateUID();
            console.log("GIVE THIS SEED TO THE OTHER PERSON:", servseed);
        }
        const rel = await relay();
        const keyPair = DHT.keyPair(DHT.hash(Buffer.from('forward' + servseed + proto + port)));
        return (rel)[proto].server(keyPair, port, host);
    }
}
for (forwarder of schema) {
    modes[forwarder.mode](forwarder.proto, forwarder.port, forwarder.host || forwarder.serverport || forwarder.port);
}
