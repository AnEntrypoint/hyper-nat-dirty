const tape = require('tape')
const { randomBytes } = require('crypto')
const RoutingTable = require('./')

tape('basic', function (assert) {
  const table = new RoutingTable(id())
  const node = { id: id() }

  assert.ok(table.add(node))
  assert.same(table.closest(id()), [node])
  assert.end()
})

function id () {
  return randomBytes(32)
}
