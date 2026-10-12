import test from 'node:test'
import assert from 'node:assert/strict'
import { enabledFor, userQuery, enhanceStep, MAX_QUERY_CHARS, MAX_RESULT_CHARS } from '../lib/core.js'
import { Config } from '../lib/index.js'

const user = (text) => ({ source: { kind: 'user' }, content: [{ type: 'text', text }] })
const agent = (id) => ({ session: { id } })
const decision = (messages) => ({ kind: 'enter', messages })

test('开关只影响被标记的会话', () => {
  const config = { enabledSessions: { a: true, b: false } }
  assert.equal(enabledFor(config, 'a'), true)
  assert.equal(enabledFor(config, 'b'), false)
  assert.equal(enabledFor(config, 'c'), false)
  const resolved = Config({ enabledSessions: { a: true } })
  assert.equal(enabledFor(resolved, 'a'), true)
  assert.equal(enabledFor(resolved, 'b'), false)
})

test('只提取真人新消息，忽略旧的插件上下文', () => {
  const query = userQuery([user('  如何处理客户异议？  '), { source: { kind: 'sales-mode' }, content: [{ type: 'text', text: '旧结果' }] }])
  assert.equal(query, '如何处理客户异议？')
  assert.equal(userQuery([user('x'.repeat(MAX_QUERY_CHARS + 20))]).length, MAX_QUERY_CHARS)
})

test('开启后每轮调用一次配置的工具并注入结果', async () => {
  const calls = []
  const config = { enabledSessions: { s1: true }, toolName: 'mcp__skill-omniscience__sales_champion_coach__query' }
  const message = user('怎样提升沟通能力？')
  const output = await enhanceStep({
    decision: decision([message]), payload: { agent: agent('s1'), messages: [message], signal: new AbortController().signal }, config,
    execute: async (request) => { calls.push(request); return { isError: false, content: [{ type: 'text', text: '先倾听，再复述。' }] } },
    makeMessage: (text) => ({ source: { kind: 'sales-mode' }, content: [{ type: 'text', text }] })
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].query, '怎样提升沟通能力？')
  assert.equal(output.messages.length, 2)
  assert.match(output.messages[1].content[0].text, /先倾听，再复述/)
})

test('关闭或非真人步骤不调用工具', async () => {
  let count = 0
  const execute = async () => { count++; return { content: [] } }
  const makeMessage = () => { throw new Error('不应注入') }
  const first = await enhanceStep({ decision: decision([user('hi')]), payload: { agent: agent('off'), messages: [user('hi')] }, config: { enabledSessions: {} }, execute, makeMessage })
  const second = await enhanceStep({ decision: decision([]), payload: { agent: agent('on'), messages: [] }, config: { enabledSessions: { on: true } }, execute, makeMessage })
  assert.equal(count, 0)
  assert.equal(first.messages.length, 1)
  assert.equal(second.messages.length, 0)
})

test('工具错误明确告知模型，不伪装成功', async () => {
  const msg = user('报价怎么谈？')
  const output = await enhanceStep({
    decision: decision([msg]), payload: { agent: agent('s1'), messages: [msg] }, config: { enabledSessions: { s1: true } },
    execute: async () => ({ isError: true, content: [{ type: 'text', text: 'AUTH_FAILED' }] }),
    makeMessage: (text) => ({ content: [{ type: 'text', text }] })
  })
  assert.match(output.messages[1].content[0].text, /查询失败/)
  assert.match(output.messages[1].content[0].text, /AUTH_FAILED/)
  assert.match(output.messages[1].content[0].text, /不要假装调用成功/)
})

test('长结果截断，避免撑爆会话上下文', async () => {
  const msg = user('建议')
  const output = await enhanceStep({
    decision: decision([msg]), payload: { agent: agent('s1'), messages: [msg] }, config: { enabledSessions: { s1: true } },
    execute: async () => ({ isError: false, content: [{ type: 'text', text: 'a'.repeat(MAX_RESULT_CHARS + 500) }] }),
    makeMessage: (text) => ({ content: [{ type: 'text', text }] })
  })
  assert.equal(output.messages[1].content[0].text.endsWith('a'.repeat(MAX_RESULT_CHARS)), true)
})
