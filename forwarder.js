const DHT = require("@hyperswarm/dht");
const pump = require("pump");
const node = new DHT({});
var net = require("net");
const udp = require('dgram');
const options = require('./options.json');
const { showCompletionScript } = require("yargs");

const relay = async () => {
    console.log('starting node');
    const node = new DHT({});
    await node.ready();
    return {
        tcp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
                server.on("connection", function (servsock) {
                    console.log('relaying to ' + port);
                    var socket = net.connect(port, host);
                    pump(servsock, socket, servsock);
                });

                server.listen(keyPair);
                console.log('listening to', keyPair.publicKey.toString('hex'));
                return keyPair.publicKey;
            },
            client: async (publicKey, port) => {
                var server = net.createServer(function (local) {
                    console.log('connecting to', publicKey.toString('hex'));
                    const socket = node.connect(publicKey);
                    pump(local, socket, local);
                });
                server.listen(port, "127.0.0.1");
                console.log('listening to', port);
                return publicKey;
            }
        },
        udp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
                await server.listen(keyPair);
                console.log('listening to', keyPair.publicKey.toString('hex'));
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
const seed = options.seed;

const modes = {
    client: async (seed, proto, port, serverport) => {
        const rel = await relay();
        console.log('calling client', seed, proto, port, serverport);
        const publicKey = DHT.keyPair(DHT.hash(Buffer.from('forward' + seed + proto + serverport))).publicKey;
        console.log(rel, proto, rel[proto]);
        return (rel)[proto].client(publicKey, port);
    },
    server: async (seed, proto, port, host) => {
        const rel = await relay();
        console.log('calling server', seed, proto, port, host);
        const keyPair = DHT.keyPair(DHT.hash(Buffer.from('forward' + seed + proto + port)));
        console.log(rel, proto, rel[proto]);
        return (rel)[proto].server(keyPair, port, host);
    }
}

for (forwarder of schema) {
    modes[forwarder.mode](seed, forwarder.proto, forwarder.port, forwarder.host || forwarder.serverport || forwarder.port);
}
