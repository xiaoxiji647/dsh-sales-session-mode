import test from 'node:test'
import assert from 'node:assert/strict'
import { Config, apply } from '../lib/index.js'

test('Host 在会话开启时调用 MCP，关闭后停止；状态可热更新', async () => {
  const schema = Config.toJSON()
  assert.equal(Object.values(schema.refs).some((part) => part.type === 'dict' && part.meta?.volatile === true), true)
  const config = Config({ enabledSessions: { active: true } })
  let promptSection
  let preStep
  const calls = []
  const ctx = {
    effect(factory) { factory() },
    systemPrompt: { section(section) { promptSection = section; return () => {} } },
    on(event, listener) { assert.equal(event, 'agent/pre-step'); preStep = listener; return () => {} },
    tools: { async execute(call) {
      calls.push(call)
      return { isError: false, content: [{ type: 'text', text: '先问需求，再确认预算。' }] }
    } }
  }
  apply(ctx, config)
  assert.match(promptSection.text({ agent: { session: { id: 'active' } } }), /销冠模式/)
  assert.equal(promptSection.text({ agent: { session: { id: 'other' } } }), '')

  const message = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '怎么谈价格？' }] }
  const payload = { agent: { session: { id: 'active' } }, messages: [message], signal: new AbortController().signal }
  const result = await preStep(payload, async () => ({ kind: 'enter', messages: [message] }))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'mcp__skill-omniscience__sales_champion_coach__query')
  assert.deepEqual(calls[0].arguments, { query: '怎么谈价格？' })
  assert.equal(calls[0].agent, payload.agent)
  assert.equal(result.messages[1].source.kind, 'sales-session-mode')
  assert.match(result.messages[1].content[0].text, /先问需求/)

  config.enabledSessions[Symbol.for('cosmokit.volatile.write')]({})
  assert.equal(promptSection.text({ agent: { session: { id: 'active' } } }), '')
  const afterOff = await preStep(payload, async () => ({ kind: 'enter', messages: [message] }))
  assert.equal(afterOff.messages.length, 1)
  assert.equal(calls.length, 1)
})
