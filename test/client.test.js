import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

test('Client 注册会话输入栏按钮，并仅修改当前会话的配置路径', async () => {
  const file = fileURLToPath(new URL('../lib/client.js', import.meta.url))
  const code = await readFile(file, 'utf8')
  let plugin
  let slot
  const writes = []
  const state = { status: 'ready', writable: true, mode: 'host', value: { enabledSessions: {} } }
  const form = {
    getSnapshot: () => state,
    subscribe: () => () => {},
    mutate: async (ops) => { writes.push(ops); return true }
  }
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useSyncExternalStore: (_sub, get) => get(),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {}
  }
  const sandbox = {
    window: { __ModuleLoader__: { load: ({ id, factory }) => {
      assert.equal(id, 'dsh-sales-session-mode')
      plugin = factory((name) => { assert.equal(name, 'react'); return React })
    } } }
  }
  vm.runInNewContext(code, sandbox, { filename: file })
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'configForms'])
  plugin.apply({ inject: (_deps, fn) => fn({
    configForms: { get: (id) => { assert.equal(id, 'sales-session-mode'); return form } },
    slots: { inject: (_name, factory) => factory(), register: (options, component) => { slot = { options, component }; return () => {} } }
  }) })
  assert.equal(slot.options.name, 'conversation.input.right')
  const button = slot.component({ form, sessionId: 'only-this-chat' })
  assert.equal(button.type, 'button')
  assert.equal(button.props['aria-pressed'], false)
  button.props.onClick()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(writes.length, 1)
  assert.equal(writes[0][0].op, 'set')
  assert.equal(JSON.stringify(Array.from(writes[0][0].path)), JSON.stringify(['enabledSessions', 'only-this-chat']))

  state.value.enabledSessions['only-this-chat'] = true
  const onButton = slot.component({ form, sessionId: 'only-this-chat' })
  assert.equal(onButton.props['aria-pressed'], true)
  onButton.props.onClick()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(writes[1][0].op, 'unset')
})
