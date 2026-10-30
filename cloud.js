(() => {
  'use strict';

  const config = {
    url: String(window.LEDGER_SUPABASE_URL || '').replace(/\/$/, ''),
    key: String(window.LEDGER_SUPABASE_KEY || '')
  };
  const sessionKey = 'dailyLedgerSupabaseSession_v1';
  const baseStateKey = window.__LEDGER_KEY || 'dailyLedger2026_v3';
  let stateKey = baseStateKey;
  const API = '/rest/v1/ledger_snapshots';
  let session = null;
  let user = null;
  let version = 0;
  let pushing = false;
  let pushTimer = null;
  let pendingState = null;
  let retryRequired = false;
  let remoteAhead = false;
  let initialized = false;
  let lastLocalWrite = 0;

  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function sessionRead() {
    try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); }
    catch { return null; }
  }
  function sessionWrite(value) {
    session = value;
    if (value) localStorage.setItem(sessionKey, JSON.stringify(value));
    else localStorage.removeItem(sessionKey);
  }
  function captureAuthCallback() {
    if (!location.hash || location.hash.length < 2) return false;
    const params = new URLSearchParams(location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return false;
    sessionWrite({
      access_token: accessToken, refresh_token: refreshToken,
      expires_in: Number(params.get('expires_in') || 3600),
      expires_at: Math.floor(Date.now() / 1000) + Number(params.get('expires_in') || 3600),
      token_type: params.get('token_type') || 'bearer'
    });
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }
  function validConfig() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url) &&
      config.key.length > 20 && !config.key.includes('YOUR_');
  }
  function headers(extra = {}, token = session?.access_token) {
    return {
      apikey: config.key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }
  async function request(path, options = {}, token = session?.access_token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    let body = null;
    try {
      response = await fetch(config.url + path, {
        ...options,
        headers: headers(options.headers || {}, token),
        signal: controller.signal
      });
      try { body = await response.json(); }
      catch (error) { if (error?.name === 'AbortError') throw error; }
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('Supabase did not respond within 15 seconds. Check your connection, then retry. Your cloud data was not changed.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const error = new Error(body?.msg || body?.message || body?.error_description || body?.error || `Supabase request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return body;
  }
  async function refreshSession() {
    if (!session?.refresh_token) return false;
    try {
      const next = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      }, null);
      sessionWrite({ ...next, expires_at: Math.floor(Date.now() / 1000) + (next.expires_in || 3600) });
      return true;
    } catch {
      sessionWrite(null);
      return false;
    }
  }
  async function freshToken() {
    if (!session) throw new Error('Sign in to sync your ledger.');
    if ((session.expires_at || 0) * 1000 < Date.now() + 60_000) {
      if (!await refreshSession()) throw new Error('Your session expired. Sign in again.');
    }
    return session.access_token;
  }
  async function authRequest(path, body) {
    return request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }, null);
  }
  async function identify() {
    await freshToken();
    const result = await request('/auth/v1/user');
    user = result;
    // Keep each account's browser cache separate on shared devices.
    stateKey = `${baseStateKey}::user:${result.id}`;
    return result;
  }
  async function cloudRow() {
    await freshToken();
    const rows = await request(`${API}?select=state,version,updated_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }
  function localState() {
    try { return JSON.parse(localStorage.getItem(stateKey) || 'null'); }
    catch { return null; }
  }
  function discardAIImportImages(state) {
    if (!state || typeof state !== 'object') return state;
    (state.data || []).forEach(row => { if (row && typeof row === 'object') delete row.aiReceiptIds; });
    if (state.extra && typeof state.extra === 'object') delete state.extra.aiReceipts;
    return state;
  }
  function attachLocalImages(state, local) {
    if (!state) return state;
    if (local) {
      const oldRows = new Map((local.data || []).map(row => [row.id, row]));
      state.data = (state.data || []).map(row => {
        const previous = oldRows.get(row.id);
        return previous?.receipts?.length ? { ...row, receipts: previous.receipts } : row;
      });
    }
    return discardAIImportImages(state);
  }
  // AI image data is excluded before snapshot serialization.
  function cloudCopy(value) {
    const data = (value.data || []).map(row => {
      const { receipts, aiReceiptIds, ...transaction } = row;
      return transaction;
    });
    const extra = value.extra ? { ...value.extra } : undefined;
    if (extra) delete extra.aiReceipts;
    const copy = { ...value, data, ...(extra ? { extra } : {}) };
    return JSON.parse(JSON.stringify(copy));
  }
  function currentUserState() {
    return localState() || {
      data: [], accounts: [], currencies: [{ code: 'USD', symbol: '$', perUSD: 1 }, { code: 'BDT', symbol: '৳', perUSD: 120 }],
      iOwe: [], owedToMe: [], events: [], userCats: [], extra: { budgets: {}, bills: [], audit: [] }, version: 4
    };
  }
  function setState(state) {
    localStorage.setItem(stateKey, JSON.stringify(state));
  }
  function setStatus(message, kind = '') {
    const el = $('ledgerCloudStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = kind;
  }
  function authView(message = '') {
    document.querySelector('.wrap')?.classList.add('ledger-hidden');
    document.getElementById('ledgerAuthGate')?.remove();
    const gate = document.createElement('main');
    gate.id = 'ledgerAuthGate';
    gate.innerHTML = `
      <section class="ledger-auth-card">
        <div class="ledger-auth-mark">DL</div>
        <p class="ledger-auth-eyebrow">PRIVATE CLOUD LEDGER</p>
        <h1>Daily Ledger</h1>
        <p class="ledger-auth-copy">Sign in to open your ledger on this device. The same account works on your phone and Mac.</p>
        ${message ? `<p class="ledger-auth-message" role="status">${escapeText(message)}</p>` : ''}
        <label>Email<input id="ledgerEmail" type="email" autocomplete="username" required></label>
        <label>Password<input id="ledgerPassword" type="password" autocomplete="current-password" required minlength="8"></label>
        <div class="ledger-auth-actions">
          <button id="ledgerSignIn" class="btn-primary">Sign in</button>
          ${session?.access_token ? '<button id="ledgerRetryCloud" class="btn-ghost" type="button">Retry cloud connection</button>' : ''}
        </div>
        <p class="ledger-auth-foot">This is a private ledger. The owner creates accounts and sends invitations. Each account has its own separate ledger.</p>
        <p class="ledger-auth-config" ${validConfig() ? 'hidden' : ''}>Set your Supabase Project URL and publishable/anon key in <code>supabase-config.js</code> before publishing.</p>
      </section>`;
    document.body.appendChild(gate);
    $('ledgerSignIn').onclick = signIn;
    const retry = $('ledgerRetryCloud');
    if (retry) retry.onclick = () => location.reload();
  }
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  async function signIn() {
    if (!validConfig()) return authView('Add your Supabase URL and public key to supabase-config.js, then reload this page.');
    const email = $('ledgerEmail')?.value.trim();
    const password = $('ledgerPassword')?.value || '';
    if (!email || password.length < 8) return authView('Enter your email and a password with at least 8 characters.');
    const button = $('ledgerSignIn');
    button.disabled = true;
    try {
      const payload = await authRequest('/auth/v1/token?grant_type=password', { email, password });
      if (!payload.access_token) {
        authView('Accept the account invitation first, then sign in here.');
        return;
      }
      sessionWrite({ ...payload, expires_at: Math.floor(Date.now() / 1000) + (payload.expires_in || 3600) });
      await openLedger();
    } catch (error) {
      authView(error.message || 'Sign in failed. Check the email and password, then retry.');
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
  function appView() {
    document.getElementById('ledgerAuthGate')?.remove();
    document.querySelector('.wrap')?.classList.remove('ledger-hidden');
    if (!$('ledgerCloudBar')) {
      const bar = document.createElement('aside');
      bar.id = 'ledgerCloudBar';
      bar.innerHTML = '<span><b>Cloud sync</b> <span id="ledgerCloudStatus">Loading…</span></span><button id="ledgerSyncNow" class="btn-ghost">Sync now</button><button id="ledgerReloadCloud" class="btn-ghost" hidden>Load latest from cloud</button><button id="ledgerSignOut" class="btn-ghost">Sign out</button>';
      document.querySelector('.wrap')?.prepend(bar);
      $('ledgerSignOut').onclick = signOut;
      $('ledgerSyncNow').onclick = () => { retryRequired = false; pushLatest(); };
      $('ledgerReloadCloud').onclick = reloadCloud;
    }
    setStatus('Signed in · syncing your data');
  }
  async function writeCloud(value, first = false) {
    const state = cloudCopy(value);
    const json = JSON.stringify(state);
    if (json.length > 4_500_000) throw new Error('Cloud snapshot is too large. Download a JSON backup and remove some large local attachments first.');
    await freshToken();
    if (first || !version) {
      const result = await request(`${API}?on_conflict=user_id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ user_id: user.id, state, version: 1 })
      });
      if (Array.isArray(result) && result[0]) {
        version = Number(result[0].version) || 1;
        setStatus('Synced just now', 'ok');
        return;
      }
      const latest = await cloudRow();
      if (latest) {
        version = Number(latest.version) || 1;
        remoteAhead = true;
        setStatus('A newer cloud copy exists. Load it before editing.', 'warning');
        $('ledgerReloadCloud').hidden = false;
        return;
      }
      throw new Error('Could not create the cloud ledger. Check the setup SQL and RLS policies.');
    }
    const result = await request(`${API}?user_id=eq.${encodeURIComponent(user.id)}&version=eq.${version}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ state, version: version + 1, updated_at: new Date().toISOString() })
    });
    if (!Array.isArray(result) || !result[0]) {
      remoteAhead = true;
      setStatus('Another device has newer data. Download a backup, then load the cloud copy.', 'warning');
      $('ledgerReloadCloud').hidden = false;
      return;
    }
    version = Number(result[0].version);
    setStatus('Synced just now', 'ok');
  }
  async function pushLatest() {
    if (!user || !pendingState || pushing || remoteAhead) return;
    pushing = true;
    const state = pendingState;
    pendingState = null;
    try { await writeCloud(state); }
    catch (error) { pendingState = state; retryRequired = true; setStatus(`Saved on this device · cloud sync failed: ${error.message}`, 'error'); }
    finally {
      pushing = false;
      if (pendingState && !remoteAhead && !retryRequired) { clearTimeout(pushTimer); pushTimer = setTimeout(pushLatest, 900); }
    }
  }
  function queueWrite(value) {
    lastLocalWrite = Date.now();
    pendingState = value;
    retryRequired = false;
    setStatus('Saving to cloud…');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushLatest, 800);
  }
  async function openLedger() {
    await identify();
    const savedLocal = localState();
    if (savedLocal) { discardAIImportImages(savedLocal); setState(savedLocal); }
    const row = await cloudRow();
    if (row) {
      version = Number(row.version) || 1;
      const state = attachLocalImages(row.state, savedLocal);
      setState(state);
    } else {
      version = 0;
      const state = savedLocal || currentUserState();
      setState(state);
      appView();
      if (!window.__ledgerStart) throw new Error('Ledger app could not start. Refresh this page.');
      installSaveHook();
      if (!initialized) { initialized = true; window.__ledgerStart(); }
      await writeCloud(state, true);
      return;
    }
    appView();
    installSaveHook();
    if (!initialized) { initialized = true; window.__ledgerStart(); }
    setStatus('Synced just now', 'ok');
  }
  function installSaveHook() {
    const store = window.__ledgerStore;
    if (!store || store.__cloudHooked) return;
    store.read = () => localState();
    store.write = value => {
      try { setState(value); }
      catch { return false; }
      if (user) queueWrite(value);
      return true;
    };
    store.__cloudHooked = true;
  }
  async function reloadCloud() {
    if (Date.now() - lastLocalWrite < 1500 && !confirm('Load the cloud copy? Any unsynced edits on this device will be replaced. Download a backup first if needed.')) return;
    try {
      const row = await cloudRow();
      if (!row) throw new Error('No cloud copy was found.');
      const state = attachLocalImages(row.state, localState());
      setState(state);
      location.reload();
    } catch (error) { setStatus(error.message, 'error'); }
  }
  async function signOut() {
    if (!confirm('Sign out of this device? Data already synced to Supabase stays in your account.')) return;
    try { await request('/auth/v1/logout', { method: 'POST' }); } catch {}
    sessionWrite(null);
    user = null;
    location.reload();
  }
  async function checkRemote() {
    if (!user || document.visibilityState !== 'visible' || pendingState || pushing) return;
    try {
      const row = await cloudRow();
      if (row && Number(row.version) > version) {
        remoteAhead = true;
        setStatus('Updated on another device · load the latest copy', 'warning');
        $('ledgerReloadCloud').hidden = false;
      }
    } catch {}
  }
  async function invoke(action, body = {}) {
    if (!validConfig()) throw new Error('Supabase is not configured yet.');
    await freshToken();
    const response = await fetch(`${config.url}/functions/v1/ledger-ai-import`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }),
      body: JSON.stringify({ ...body, action })
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) throw new Error(result.error || `AI request failed (${response.status}).`);
    return result;
  }
  window.LedgerCloud = { invoke, get signedIn() { return Boolean(user); } };
  document.head.insertAdjacentHTML('beforeend', `<style>
    .ledger-hidden{display:none!important}#ledgerAuthGate{min-height:100vh;display:grid;place-items:center;padding:22px;background:var(--paper,#f4f5f2);font-family:Inter,system-ui,sans-serif;color:var(--ink,#19211f)}
    .ledger-auth-card{width:min(100%,430px);background:white;border:1px solid #e5e7e2;border-radius:18px;padding:28px;box-shadow:0 12px 40px #19211f12}
    .ledger-auth-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#245746;color:#fff;font-weight:700}
    .ledger-auth-eyebrow{font-size:11px;letter-spacing:.15em;color:#707a74;margin:20px 0 2px}.ledger-auth-card h1{font-size:28px;margin:0}
    .ledger-auth-copy,.ledger-auth-foot,.ledger-auth-config{color:#707a74;font-size:13px}.ledger-auth-card label{display:block;font-size:12px;color:#58625b;margin:14px 0}
    .ledger-auth-card input{margin-top:5px}.ledger-auth-actions{display:flex;gap:8px;margin-top:18px}.ledger-auth-actions button{flex:1}
    .ledger-auth-message{color:#245746;background:#e4efe9;border-radius:8px;padding:10px}.ledger-auth-config{color:#a33;background:#fff0ed;padding:10px;border-radius:8px}
    #ledgerCloudBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:#fff;border:1px solid var(--line,#e5e7e2);border-radius:10px;font-size:12px;color:var(--muted,#707a74)}
    #ledgerCloudBar>span{flex:1;min-width:180px}#ledgerCloudBar b{color:var(--ink,#19211f);margin-right:8px}#ledgerCloudStatus[data-kind=error]{color:#a33}#ledgerCloudStatus[data-kind=warning]{color:#985018}#ledgerCloudStatus[data-kind=ok]{color:#24734e}
    #ledgerReloadCloud[hidden]{display:none}@media(max-width:600px){.ledger-auth-card{padding:22px}.ledger-auth-actions{flex-direction:column}#ledgerCloudBar{align-items:stretch}#ledgerCloudBar button{width:100%}}
  </style>`);
  if (validConfig()) {
    captureAuthCallback();
    const cached = sessionRead();
    if (cached?.access_token) {
      session = cached;
      (async () => {
        try { await openLedger(); }
        catch (error) {
          if (error?.status === 401 || error?.status === 403) sessionWrite(null);
          authView(error.message || 'Could not open the cloud ledger. Retry the connection or sign in again.');
        }
      })();
    } else authView();
  } else authView();
  window.addEventListener('focus', checkRemote);
  window.addEventListener('online', () => { if (pendingState) { retryRequired = false; pushLatest(); } });
  document.addEventListener('visibilitychange', checkRemote);
})();
