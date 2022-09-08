# hyper-nat

This program can tunnel a set of UDP and TCP connections to your computer, allowing them to carry out two directional communications between a server and many clients.

Here is an example of hosting a valheim running for 3 players using this tool over an ordinary mobile phone hotspot with a 10mbps internet connection 

Run server ports on one computer, and run client ports on a group of clients, and you can connect a group of computers to your server.

https://www.youtube.com/watch?v=iFyCTpgiTUE
If you do not wish to download node.js, you can get an exe under releaases.

Configure a options.json file

# server config for a udp and a tcp port
mode selects client or server
proto selects tcp or udp
port specifies the port number
serverport specifies the port number on the server
host specifies where the server is running
```
{
    "schema": [
        {
            "mode": "server",
            "proto": "udp",
            "port": "7913",
            "host": "127.0.0.1"
        },
        {
            "mode": "server",
            "proto": "tcp",
            "port": "7915",
            "host": "127.0.0.1"
        }
    ]
}
```
# client config for the same ports
mode selects client or server
proto selects tcp or udp
port specifies the port number
serverport specifies the port number on the server
```
{
    {
        "mode": "client",
        "proto": "udp",
        "port": "7913",
        "serverport": "7913"
    },
    {
        "mode": "client",
        "proto": "tcp",
        "port": "7915",
        "serverport": "7915"
    }

}
```

# building
To build the exe yourself, use a nexe compatible version of node, then run nexe in the path, remember to copy the static builds for sodium and udx

