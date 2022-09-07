window.schema = [
  {
    type: "input",
    title: "seed",
    name: "seed",
  },
  {
    type: "list",
    name: "udp",
    title: "Udp ports to forward",
    schema: [
        {
          type: "input",
          name: "port",
          title: "Port",
        },
        {
          type: "input",
          name: "port",
          title: "Port",
        },
        {
          type: "input",
          name: "host",
          title: "Host",
        }
    ]
  },
  {
    type: "list",
    name: "tcp",
    title: "Tcp ports to forward",
    schema: [
        {
          type: "input",
          name: "port",
          title: "Port",
        },
        {
          type: "input",
          name: "port",
          title: "Port",
        },
        {
          type: "input",
          name: "host",
          title: "Host",
        }
    ]
  }
];
