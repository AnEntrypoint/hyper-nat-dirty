# server config
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
# client config 
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