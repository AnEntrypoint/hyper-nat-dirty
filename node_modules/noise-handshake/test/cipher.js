/* eslint-disable camelcase */
const {
  crypto_aead_chacha20poly1305_ietf_KEYBYTES,
  crypto_aead_chacha20poly1305_ietf_NPUBBYTES,
  crypto_aead_chacha20poly1305_ietf_ABYTES
} = require('sodium-universal/crypto_aead')
const { randombytes_buf } = require('sodium-universal/randombytes')
const Cipher = require('../cipher')
const test = require('tape')

test('constants', function (assert) {
  assert.ok(Cipher.KEYBYTES === 32, 'KEYBYTES conforms to Noise Protocol')
  assert.ok(Cipher.NONCEBYTES === 8, 'NONCEBYTES conforms to Noise Protocol')
  assert.ok(Cipher.MACBYTES === 16, 'MACBYTES conforms to Noise Protocol')

  assert.ok(Cipher.KEYBYTES === crypto_aead_chacha20poly1305_ietf_KEYBYTES, 'KEYBYTES')
  assert.ok(Cipher.NONCEBYTES + 4 === crypto_aead_chacha20poly1305_ietf_NPUBBYTES, 'NONCEBYTES')
  assert.ok(Cipher.MACBYTES === crypto_aead_chacha20poly1305_ietf_ABYTES, 'MACBYTES')

  assert.end()
})

test('identity', function (assert) {
  const key = Buffer.alloc(Cipher.KEYBYTES)
  randombytes_buf(key)

  const key2 = Buffer.alloc(Cipher.KEYBYTES)
  randombytes_buf(key2)

  const plaintext = Buffer.from('Hello world')

  const cipher = new Cipher(key)
  const ciphertext = cipher.encrypt(plaintext)

  assert.throws(_ => cipher.decrypt(ciphertext, Buffer.alloc(1)))
  for (let i = 0; i < ciphertext.length; i++) {
    ciphertext[i] ^= i + 1
    assert.throws(_ => cipher.decrypt(ciphertext))
    ciphertext[i] ^= i + 1
  }

  cipher.initialiseKey(key)
  const decrypted = cipher.decrypt(ciphertext)

  assert.same(decrypted, plaintext)
  assert.end()
})

test('identity with ad', function (assert) {
  const key = Buffer.alloc(Cipher.KEYBYTES)
  randombytes_buf(key)

  const cipher = new Cipher(key)

  const ad = Buffer.from('version 0')

  const key2 = Buffer.alloc(Cipher.KEYBYTES)
  randombytes_buf(key2)

  const cipher2 = new Cipher(key2)

  const plaintext = Buffer.from('Hello world')
  const ciphertext = cipher.encrypt(plaintext, ad)

  assert.throws(_ => cipher.decrypt(ciphertext, Buffer.alloc(1)), 'should not have ad')
  assert.throws(_ => cipher2.decrypt(ciphertext, ad), 'wrong key')

  cipher2.key = key
  cipher2.nonce = 2
  assert.throws(_ => cipher2.decrypt(ciphertext, ad), 'wrong nonce')

  for (let i = 0; i < ciphertext.length; i++) {
    ciphertext[i] ^= 255
    assert.throws(_ => cipher.decrypt(ciphertext, ad))
    ciphertext[i] ^= 255
  }

  cipher.initialiseKey(key)
  const decrypted = cipher.decrypt(ciphertext, ad)

  assert.same(decrypted, plaintext)
  assert.end()
})

// test.skip('rekey', function (assert) {
//   const key = Buffer.alloc(Cipher.KEYBYTES)
//   const nonce = Buffer.alloc(Cipher.NONCEBYTES)
//   randombytes_buf(key)
//   randombytes_buf(nonce)

//   const keyCopy = Buffer.from(key)
//   cipher.rekey(key, key)
//   assert.notOk(Buffer.equals(key, keyCopy))

//   const plaintext = Buffer.from('Hello world')
//   const ciphertext = Buffer.alloc(plaintext.byteLength + Cipher.MACBYTES)
//   const decrypted = Buffer.alloc(plaintext.byteLength)

//   cipher.encrypt(ciphertext, key, nonce, null, plaintext)

//   assert.throws(_ => cipher.decrypt(ciphertext, null), 'wrong key')

//   cipher.rekey(keyCopy, keyCopy)
//   cipher.decrypt(decrypted, keyCopy, nonce, null, ciphertext)

//   assert.ok(Buffer.equals(decrypted, plaintext))
//   assert.end()
// })
