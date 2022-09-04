const test = require('brittle')
const Xache = require('.')

test('basic', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  c.set(1, true)
  c.set(2, true)
  c.set(3, true)
  c.set(4, true)

  t.alike([...c], [[1, true], [2, true], [3, true], [4, true]])

  c.set(5, true)

  t.alike([...c], [[5, true], [1, true], [2, true], [3, true], [4, true]], 'bumped the generations')

  c.set(2, true)

  t.alike([...c], [[5, true], [2, true], [1, true], [3, true], [4, true]], 'bumped the key')

  c.set(6, true)
  c.set(7, true)

  t.alike([...c], [[5, true], [2, true], [6, true], [7, true]])
})

test('falsy values', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  for (const v of [null, undefined, false, 0, NaN, '']) {
    c.set(1, v)
    t.ok(c.has(1))
    t.alike(c.get(1), v)
  }
})

test('retain', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  c.retain(1, true)

  for (let i = 2; i < 10; i++) {
    c.set(i, true)
  }

  t.alike([...c], [[6, true], [7, true], [8, true], [9, true], [1, true]])
})

test('retain + set + get', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  c.retain(1, true)
  c.set(1, false)

  t.is(c.get(1), true)
})

test('set + retain + get', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  c.set(1, false)
  c.retain(1, true)

  t.is(c.get(1), true)
})

test('retain + clear + get', function (t) {
  const c = new Xache({
    maxSize: 4
  })

  c.retain(1, true)
  t.is(c.get(1), true)

  c.clear()
  t.is(c.get(1), null)
})
