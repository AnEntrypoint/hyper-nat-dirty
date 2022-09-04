var udp = require('dgram');
const yargs = require('yargs');
const pump = require('pump');
const argv = yargs
    .option('mode', {
        alias: 'm',
        describe: 'client or server'
    }).option('host', {
        alias: 'h'
    }).option('port', {
        alias: 'p'
    }).option('secret', {
        alias: 's'
    }).help();

const DHT = require("@hyperswarm/dht");
const node = new DHT({});

async function toArray(iterable) {
    const result = []
    for await (const data of iterable) result.push(data)
    return result
}

const getKey = async (name) => {
    let publicKey;
    const target = DHT.hash(Buffer.from(name));
    console.log("hash is:", name);
    const result = await toArray(node.lookup(target));
    if (result.length > 0) {
        for (res of result) {
            for (peer of res.peers) {
                return peer.publicKey;
            }
        }
    } else {
        console.log('no results');
    }
    return publicKey;
}

const initserver = async (argv) => {
    const { secret, port, host } = argv;
    await node.ready();
    const hash = DHT.hash(Buffer.from('forward' + secret))
    console.log("Announcing:", 'forward' + secret, new Date(), hash);
    const keyPair = DHT.keyPair(hash);
    await node.announce(hash, keyPair).finished();
    const server = node.createServer();
    server.listen(keyPair);

    let sent=0, received=0;
    setInterval(()=>{console.log({sent, received})}, 1000);
    server.on("connection", function (conn) {
        console.log('connected')
        conn.on('data', (buf) => {
            const clientport = parseInt(buf);
            console.log('new port opening', buf.toString(), clientport);
            var client = udp.createSocket('udp4');
            client.connect(port, host);
            client.on('message', (buf) => {
                ++sent;
                conn.rawStream.send(buf);
            })
            conn.rawStream.on('message', function (buf) {
                ++received;
                client.send(buf);
            })
        })
    });
}

const initclient = async (argv) => {
    const { secret, port } = argv;

    await node.ready();

    const publicKey = await getKey('forward' + secret);
    var server = udp.createSocket('udp4');

    const conn = await node.connect(publicKey);
    let sent=0, received=0;
    setInterval(()=>{console.log({sent, received})}, 1000);

    conn.on('open', () => {
        console.log('Client connected!')
        let clientport;
        let clientaddress;
        server.on('listening', () => {
            console.log('Server is listening at port ' + port);

            conn.rawStream.on('message', (buf) => {
                ++received;
                server.send(buf, clientport);
            })
            server.on('message', async (buf, rinfo) => {
                ++sent;
                if(!clientport) {
                    clientport = rinfo.port;
                    clientaddress = rinfo.address;
                    server.connect(clientport);
                    await conn.write(rinfo.port.toString());
                    conn.rawStream.send(buf);
                } else {
                    conn.rawStream.send(buf);
                }
            })
        });

        server.on('error', (error) => {
            console.log('Error: ' + error);
            server.close();
        });
        server.bind(port)
    })
}

if (argv.argv.mode == 'client') {
    initclient(argv.argv)
}

if (argv.argv.mode == 'server') {
    initserver(argv.argv)
}

/*var client = udp.createSocket('udp4');
client.connect(27015, '192.169.16.126')
client.on('connect', ()=>{
    client.on('message',function(msg,info){
        console.log('Data received from server : ' + msg.toString());
        console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
    });
    console.log('Sending:', Buffer.from('ffffffff54536f7572636520456e67696e6520517565727900', 'hex').toString());
    client.send(Buffer.from('ffffffff54536f7572636520456e67696e6520517565727900', 'hex'));
})*/