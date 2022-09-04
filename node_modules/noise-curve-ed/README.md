# noise-curve-ed

Ed25519 elliptic curve operations for [`noise-handshake`](https://github.com/chm-diederichs/noise-handshake)

## Usage
```js
const curve = require('noise-curve-ed')
const Noise = require('noise-handshake')

const handshake = new Noise(pattern, initiator, staticKeyPair, { curve })
```

## API

#### constants

`DHLEN` = 32
`PKLEN` = 32
`SKLEN` = 64
`ALG` = 'Ed25519'

#### `generateKeyPair([privKey])`

Generate a new keypair, optionally pass in a preexisting `privKey`. Return value is of the form:

```
{
  publicKey,
  secretKey
}
```

#### `dh(pk, lsk)`

Perform DH between `pk` and `lsk` and return the result.
