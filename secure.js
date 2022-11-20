const path =  require("path");
const { WindowsToaster } = require("node-notifier");
const AppName = "hyperbolic-gate";
const executable = process.argv[0];
const SysTray = require('systray').default;
const systray = new SysTray({
    menu: {
        icon: "AAABAAEAEBAAAAEAGABoAwAAFgAAACgAAAAQAAAAIAAAAAEAGAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAnf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AXv8AhP8AXv8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AhP8AhP8AXv8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AhP8AhP8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AhP8AhP8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AhP8AhP8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AhP8AhP8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AhP8AhP8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AXv8AXv8AXv8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8Anf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        title: "",
        tooltip: "hyperbolic gateway",
        items: [{
            title: "Exit",
            tooltip: "exit hyperbolic gateway",
            checked: false,
            enabled: true
        }]
    },
    debug: false,
    copyDir: true,
})
 
systray.onClick(action => {
    if (action.seq_id === 0) {
        systray.kill();
    }
})
 
const snoreToastPath = executable.endsWith(".exe") ? path.resolve(executable, "../", "snoretoast-x64.exe") : null;
let notifierOptions = { withFallback: false, customPath: snoreToastPath };
const notifier = new WindowsToaster(notifierOptions);


const Keychain = require('keypear');
const DHT = require("@hyperswarm/dht");
const pump = require("pump");
var net = require("net");
const udp = require('dgram');
const options = require('./options.json');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const { base58_to_binary, binary_to_base58 } = require('base58-js')
const relay = async () => {
    const node = new DHT({});
    await node.ready();
    return {
        tcp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
                server.on("connection", function (servsock) {
                    console.log('new connection, relaying to ' + port);
                    var socket = net.connect(port, host);
                    pump(servsock, socket, servsock);
                });

                console.log('listening for remote connections for tcp ', port);
                server.listen(keyPair);
            },
            client: async (publicKey, port) => {
                var server = net.createServer(function (local) {
                    console.log('connecting to tcp ', port);
                    const socket = node.connect(publicKey);
                    pump(local, socket, local);
                });
                server.listen(port, "127.0.0.1");
                console.log('listening for local connections on tcp', port);
            }
        },
        udp: {
            server: async (keyPair, port, host) => {
                const server = node.createServer();
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
                console.log('listening for remote connections for udp', port);
                await server.listen(keyPair);
            },
            client: async (publicKey, port) => {
                console.log('connecting to udp', port);
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
                console.log('UDP stream ready, listening for packets on ', port);
            }
        }
    }
}

const schema = options.schema;
let publicKey;
let noticed;
const modes = {
    client: async (settings) => {
        const {proto, port, publicKey} = settings;
        const keys = new Keychain(base58_to_binary(publicKey));
        const key = keys.get(proto+port).publicKey;
        const rel = await relay();
        return (rel)[proto].client(key, port);
    },
    server: async (settings) => {
        const {proto, port, host, secret} = settings;
        const kp = DHT.keyPair(DHT.hash(new Uint8Array(secret)));
        console.log("SHARE THIS PUBLIC KEY:", binary_to_base58(kp.publicKey));
        const rel = await relay();
        const keys = new Keychain(kp);
        const keyPair = keys.get(proto + port);
        (rel)[proto].server(keyPair, port, host);
    }
}
const run = async () => {
    console.log('starting up');
    for (forwarder of schema) {
        await modes[forwarder.mode](forwarder);
    }

}
run()


