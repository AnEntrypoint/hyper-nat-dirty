const test = require('brittle')
const b4a = require('b4a')
const crypto = require('./')

test('randomBytes', function (t) {
  const buffer = crypto.randomBytes(100)
  t.ok(b4a.isBuffer(buffer))
  t.unlike(crypto.randomBytes(100), buffer)
})

test('key pair', function (t) {
  const keyPair = crypto.keyPair()

  t.is(keyPair.publicKey.length, 32)
  t.is(keyPair.secretKey.length, 64)
})

test('validate key pair', function (t) {
  const keyPair1 = crypto.keyPair()
  const keyPair2 = crypto.keyPair()

  t.absent(crypto.validateKeyPair({ publicKey: keyPair1.publicKey, secretKey: keyPair2.secretKey }))
  t.ok(crypto.validateKeyPair({ publicKey: keyPair1.publicKey, secretKey: keyPair1.secretKey }))
})

test('sign', function (t) {
  const keyPair = crypto.keyPair()
  const message = b4a.from('hello world')

  const sig = crypto.sign(message, keyPair.secretKey)

  t.is(sig.length, 64)
  t.ok(crypto.verify(message, sig, keyPair.publicKey))
  t.absent(crypto.verify(message, b4a.alloc(64), keyPair.publicKey))
})

test('hash leaf', function (t) {
  const data = b4a.from('hello world')

  t.alike(crypto.data(data), b4a.from('9f1b578fd57a4df015493d2886aec9600eef913c3bb009768c7f0fb875996308', 'hex'))
})

test('hash parent', function (t) {
  const data = b4a.from('hello world')

  const parent = crypto.parent({
    index: 0,
    size: 11,
    hash: crypto.data(data)
  }, {
    index: 2,
    size: 11,
    hash: crypto.data(data)
  })

  t.alike(parent, b4a.from('3ad0c9b58b771d1b7707e1430f37c23a23dd46e0c7c3ab9c16f79d25f7c36804', 'hex'))
})

test('tree', function (t) {
  const roots = [
    { index: 3, size: 11, hash: b4a.alloc(32) },
    { index: 9, size: 2, hash: b4a.alloc(32) }
  ]

  t.alike(crypto.tree(roots), b4a.from('0e576a56b478cddb6ffebab8c494532b6de009466b2e9f7af9143fc54b9eaa36', 'hex'))
})

test('namespace', function (t) {
  const ns = crypto.namespace('hyperswarm/secret-stream', 2)

  t.alike(ns[0], b4a.from('a931a0155b5c09e6d28628236af83c4b8a6af9af60986edeede9dc5d63192bf7', 'hex'))
  t.alike(ns[1], b4a.from('742c9d833d430af4c48a8705e91631eecf295442bbca18996e597097723b1061', 'hex'))
})

test('namespace (random access)', function (t) {
  const ns = crypto.namespace('hyperswarm/secret-stream', [1, 0])

  t.alike(ns[0], b4a.from('742c9d833d430af4c48a8705e91631eecf295442bbca18996e597097723b1061', 'hex'))
  t.alike(ns[1], b4a.from('a931a0155b5c09e6d28628236af83c4b8a6af9af60986edeede9dc5d63192bf7', 'hex'))
})

test('another namespace', function (t) {
  const ns = crypto.namespace('foo', [1])

  t.alike(ns[0], b4a.from('fff5eac99641b1b9dee6cabaaeb5959f4b452f7c83769156566aa44de89c82fb', 'hex'))
})

test('random namespace', function (t) {
  const s = Math.random().toString()
  const ns1 = crypto.namespace(s, 10).slice(1)
  const ns2 = crypto.namespace(s, [1, 2, 3, 4, 5, 6, 7, 8, 9])

  t.alike(ns1, ns2)
})
