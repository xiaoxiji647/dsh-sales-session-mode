window.__ModuleLoader__.load({ id: 'dsh-sales-session-mode', factory: function (require) {
  var module = { exports: {} }
  var React = require('react')
  var h = React.createElement
  var ENTRY_ID = 'sales-session-mode'

  function SalesModeButton(props) {
    var form = props.form
    var sessionId = String(props.sessionId)
    var snapshot = React.useSyncExternalStore(
      function (listener) { return form.subscribe(listener) },
      function () { return form.getSnapshot() },
      function () { return form.getSnapshot() }
    )
    var pendingPair = React.useState(false)
    var pending = pendingPair[0], setPending = pendingPair[1]
    var errorPair = React.useState('')
    var error = errorPair[0], setError = errorPair[1]
    var enabled = snapshot.value && snapshot.value.enabledSessions && snapshot.value.enabledSessions[sessionId] === true
    var ready = snapshot.status === 'ready' && snapshot.writable && snapshot.mode === 'host'
    var disabled = !ready || pending

    React.useEffect(function () { setError(''); setPending(false) }, [sessionId])

    function toggle() {
      if (disabled) return
      setPending(true)
      setError('')
      var op = enabled
        ? { op: 'unset', path: ['enabledSessions', sessionId] }
        : { op: 'set', path: ['enabledSessions', sessionId], value: true }
      Promise.resolve(form.mutate([op])).then(function (accepted) {
        if (!accepted) setError('开关保存失败，请重试')
      }).catch(function (cause) {
        setError('开关保存失败：' + String(cause && cause.message || cause))
      }).finally(function () { setPending(false) })
    }

    var title = error || (!ready ? '当前无法保存插件设置，请确认 DSH 本机配置可写' : enabled ? '当前会话已开启销冠模式，点击关闭' : '点击为当前会话开启销冠模式')
    var label = pending ? '销冠 · 保存中' : error ? '销冠 · 出错' : enabled ? '销冠 · 已开启' : '销冠模式'
    var style = {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      height: '28px', padding: '0 10px', borderRadius: '8px',
      border: enabled ? '1px solid #bf8d3b' : '1px solid rgba(127,127,127,.3)',
      background: enabled ? 'rgba(191,141,59,.17)' : 'transparent',
      color: enabled ? '#ad7520' : 'inherit',
      fontSize: '12px', fontWeight: enabled ? 650 : 500,
      whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .55 : 1, transition: 'background .15s ease, border-color .15s ease'
    }
    var dot = { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
      background: error ? '#d44848' : enabled ? '#c18a31' : '#929292' }
    return h('button', { type: 'button', style: style, disabled: disabled,
      title: title, 'aria-label': title, 'aria-pressed': !!enabled, onClick: toggle },
      h('span', { style: dot, 'aria-hidden': 'true' }), label)
  }

  function apply(ctx) {
    ctx.inject(['slots', 'configForms'], function (scope) {
      var form = scope.configForms.get(ENTRY_ID)
      scope.slots.inject('conversation.input.right', function () {
        return scope.slots.register({
          name: 'conversation.input.right', id: 'sales-session-mode', order: 10,
          inject: function () { return { form: form } }
        }, SalesModeButton)
      })
    })
  }

  module.exports = { name: 'dsh-sales-session-mode', inject: ['slots', 'configForms'], apply: apply }
  return module.exports
} })
