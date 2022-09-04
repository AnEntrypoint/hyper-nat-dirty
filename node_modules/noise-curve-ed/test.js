const Noise = require('noise-handshake')
const curve = require('./')
const test = require('tape')

test('XX', t => {
  const initiator = new Noise('XX', true, null, { curve })
  const responder = new Noise('XX', false, null, { curve })

  initiator.initialise(Buffer.alloc(0))
  responder.initialise(Buffer.alloc(0))

  while (!initiator.handshakeComplete) {
    const message = initiator.send()
    responder.recv(message)

    if (!responder.handshakeComplete) {
      const reply = responder.send()
      initiator.recv(reply)
    }
  }

  t.deepEqual(initiator.rx.key, responder.tx.key)
  t.deepEqual(initiator.tx.key, responder.rx.key)
  t.end()
})
