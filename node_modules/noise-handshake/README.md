# noise-handshake

## Usage
```js
const Noise = require('noise-handshake')
const Cipher = require('noise-handshake/cipher')
const initiator = new Noise('IK ', true)
const responder = new Noise('IK', false)

const prologue = Buffer.alloc(0)

// preshared key
initiator.initialise(prologue, responder.s.pub)
responder.initialise(prologue)

// -> e, es, s, ss
const message = initiator.send()
responder.recv(message)

// <- e, ee, se
const reply = responder.send()
initiator.recv(reply)

console.log(initiator.handshakeComplete) // true

// instantiate a cipher using shared secrets
const send = new Cipher(initiator.rx)
const recieve = new Cipher(initiator.tx)

const msg = Buffer.from('hello, world')

const enc = send.encrypt(msg)
console.log(recieve.decrypt(enc)) // hello, world
```

## API

#### `const peer = new Noise(pattern, initiator, staticKeypair, [opts])`

Create a new handshake state for a given pattern. Initiator should be either `true` or `false` depending on the role. A preexisting keypair may be passed as `staticKeypair`

`opts` is may be used to pass in a `curve` module for performing Noise over other curves.

Curve modules should export the following:
```
{
  DHLEN,
  PKLEN,
  SKLEN,
  ALG,
  generateKeyPair,
  dh
}
```

See [dh.js](./dh) for an example.

#### `peer.initialise(prologue, remoteStatic)`

Initialise the handshake state with a prologue and any preshared keys.

#### `const buf = send([payload])`

Send the next message in the handshake, add an optional payload buffer to be included in the message, payload is a zero length buffer by default.

#### `const payload = peer.recv(buf)`

Receive a handshake message from the peer and return the encrypted payload.

#### `peer.complete`

`true` or `false`. Indicates whether `rx` and `tx` have been created yet.

When complete, the working handshake state shall be cleared *only* the following state shall remain on the object:

```js
{
  tx, // session key to decrypt messages from remote peer
  rx, // session key to encrypt messages to remote peer
  rs, // the remote peer's public key,
  hash, // a hash of the entire handshake state
}
```
