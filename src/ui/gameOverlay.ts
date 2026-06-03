import {
  HEADLINE,
  PULL_BUTTON_LABELS,
  SUBLINE,
} from '../game/constants'
import { claimWithWallet, executePull, getResultDisplay } from '../game/pullService'
import { isDemoMode } from '../game/demoMode'
import {
  findPullByEmail,
  getInventory,
  getSessionEmail,
  isValidEmail,
  normalizeEmail,
  resetDemoBox,
  setSessionEmail,
} from '../game/storage'
import type { GamePhase, PrizeInventory, TissuePull } from '../game/types'

export interface GameOverlayCallbacks {
  onPullStart: (pull: TissuePull) => void
}

export interface GameOverlayApi {
  root: HTMLElement
  getPhase(): GamePhase
  refreshCounters(): void
  showResultForPull(pull: TissuePull): void
  finishPull(pull: TissuePull): void
}

export function createGameOverlay(
  callbacks: GameOverlayCallbacks,
): GameOverlayApi {
  const demo = isDemoMode()
  let phase: GamePhase = 'landing'
  let email = demo ? '' : getSessionEmail() ?? ''
  let currentPull: TissuePull | null = null
  let isPulling = false

  const root = document.createElement('div')
  root.id = 'game-ui'
  root.innerHTML = `
    <header class="ui-top">
      ${demo ? '<p class="demo-badge">DEMO MODE — pull as much as you want</p>' : ''}
      <p class="game-kicker">Toph's Boogers</p>
      <h1 class="game-title">${HEADLINE}</h1>
      <p class="game-sub">${demo ? 'Preview build. No email. Hit pull again anytime.' : SUBLINE}</p>
    </header>

    <aside class="ui-side ui-side-left" aria-live="polite">
      <section class="game-stats">
        <div class="stat"><span class="stat-n" data-stat="tissues">250</span><span class="stat-l">tissues left</span></div>
        <div class="stat"><span class="stat-n" data-stat="boogers">100</span><span class="stat-l">Boogers hidden</span></div>
        <div class="stat stat-rare"><span class="stat-n" data-stat="golden">5</span><span class="stat-l">golden left</span></div>
      </section>
    </aside>

    <div class="ui-stage" aria-hidden="true"></div>

    <aside class="ui-side ui-side-right">
      <p class="side-hint">Drag to rotate the box</p>
      <p class="game-mock-tag">Mock mode · localStorage</p>
    </aside>

    <footer class="ui-bottom">
      <div class="ui-bottom-card">
        <section class="game-panel" data-panel="gate">
          <div class="gate-row">
            ${demo ? '' : `
            <div class="gate-field">
              <label class="field-label" for="email-input">Email</label>
              <input id="email-input" class="field-input" type="email" placeholder="you@email.com" autocomplete="email" />
            </div>`}
            <button type="button" class="btn btn-primary" data-action="pull" ${demo ? '' : 'disabled'}>${PULL_BUTTON_LABELS[0]}</button>
          </div>
          <p class="field-note">${demo ? 'Demo pulls do not count toward the real giveaway.' : 'One pull per email · wallet only if you win'}</p>
        </section>

        <section class="game-panel hidden" data-panel="pulling">
          <p class="pulling-text">Pulling… don't break the snot seal.</p>
        </section>

        <section class="game-panel hidden" data-panel="result">
          <div class="result-row">
            <div class="result-copy">
              <p class="result-badge" data-result-badge></p>
              <h2 class="result-title" data-result-title></h2>
              <p class="result-follow" data-result-follow></p>
            </div>
            <div class="result-actions">
              <div class="wallet-block hidden" data-wallet-block>
                <button type="button" class="btn btn-wallet" data-action="wallet">Connect Wallet</button>
                <p class="wallet-note">Free Booger winners only</p>
              </div>
              <p class="claim-done hidden" data-claim-done>Booger claimed.</p>
              <button type="button" class="btn btn-share" data-action="share">Copy Share Text</button>
              <p class="share-feedback hidden" data-share-feedback>Copied!</p>
              ${demo ? '<button type="button" class="btn btn-again" data-action="again">Pull Another Tissue</button>' : ''}
            </div>
          </div>
        </section>

        <section class="game-panel hidden" data-panel="sold-out">
          <h2 class="result-title">Box is empty.</h2>
          <p class="result-follow">All 250 tissues got pulled.</p>
          ${demo ? '<button type="button" class="btn btn-primary" data-action="reset-demo">Refill Demo Box</button>' : ''}
        </section>
      </div>
    </footer>
  `

  const els = {
    emailInput: root.querySelector('#email-input') as HTMLInputElement | null,
    pullBtn: root.querySelector('[data-action="pull"]') as HTMLButtonElement,
    againBtn: root.querySelector('[data-action="again"]') as HTMLButtonElement | null,
    resetDemoBtn: root.querySelector('[data-action="reset-demo"]') as HTMLButtonElement | null,
    walletBtn: root.querySelector('[data-action="wallet"]') as HTMLButtonElement,
    shareBtn: root.querySelector('[data-action="share"]') as HTMLButtonElement,
    panels: {
      gate: root.querySelector('[data-panel="gate"]') as HTMLElement,
      pulling: root.querySelector('[data-panel="pulling"]') as HTMLElement,
      result: root.querySelector('[data-panel="result"]') as HTMLElement,
      soldOut: root.querySelector('[data-panel="sold-out"]') as HTMLElement,
    },
    stats: {
      tissues: root.querySelector('[data-stat="tissues"]') as HTMLElement,
      boogers: root.querySelector('[data-stat="boogers"]') as HTMLElement,
      golden: root.querySelector('[data-stat="golden"]') as HTMLElement,
    },
    resultBadge: root.querySelector('[data-result-badge]') as HTMLElement,
    resultTitle: root.querySelector('[data-result-title]') as HTMLElement,
    resultFollow: root.querySelector('[data-result-follow]') as HTMLElement,
    walletBlock: root.querySelector('[data-wallet-block]') as HTMLElement,
    claimDone: root.querySelector('[data-claim-done]') as HTMLElement,
    shareFeedback: root.querySelector('[data-share-feedback]') as HTMLElement,
  }

  function setPhase(next: GamePhase): void {
    phase = next
    Object.values(els.panels).forEach((p) => p.classList.add('hidden'))
    if (next === 'landing') els.panels.gate.classList.remove('hidden')
    if (next === 'pulling') els.panels.pulling.classList.remove('hidden')
    if (next === 'result' || next === 'already_pulled') {
      els.panels.result.classList.remove('hidden')
      els.panels.gate.classList.add('hidden')
    }
    if (next === 'sold_out') {
      els.panels.soldOut.classList.remove('hidden')
      els.panels.gate.classList.add('hidden')
      els.panels.result.classList.add('hidden')
    }
  }

  function updateStats(inv: PrizeInventory): void {
    els.stats.tissues.textContent = String(inv.tissuesLeft)
    els.stats.boogers.textContent = String(inv.freeBoogersLeft)
    els.stats.golden.textContent = String(inv.goldenTissuesLeft)
  }

  function refreshCounters(): void {
    const inv = getInventory()
    updateStats(inv)
    if (inv.tissuesLeft <= 0 && !demo) {
      setPhase('sold_out')
      els.pullBtn.disabled = true
    } else if (inv.tissuesLeft <= 0 && demo) {
      setPhase('sold_out')
    } else if (demo) {
      els.pullBtn.disabled = isPulling
    }
  }

  function prepareAnotherPull(): void {
    if (!demo) return
    currentPull = null
    isPulling = false
    els.pullBtn.disabled = false
    if (els.walletBtn) els.walletBtn.disabled = false
    setPhase('landing')
    els.panels.result.classList.add('hidden')
    els.panels.gate.classList.remove('hidden')
    els.pullBtn.textContent =
      PULL_BUTTON_LABELS[
        Math.floor(Math.random() * PULL_BUTTON_LABELS.length)
      ]
  }

  function renderResult(pull: TissuePull): void {
    currentPull = pull
    const display = getResultDisplay(pull)

    els.resultBadge.textContent =
      pull.result_type === 'golden_tissue'
        ? '★ GOLDEN TISSUE ★'
        : pull.result_type === 'free_booger'
          ? 'WINNER'
          : pull.result_type === 'snotlist'
            ? 'SNOTLIST'
            : 'PULLED'

    els.resultBadge.className = `result-badge badge-${pull.result_type}`
    els.resultTitle.textContent = display.title
    els.resultFollow.textContent = display.followUp

    const showWallet = display.needsWallet
    els.walletBlock.classList.toggle('hidden', !showWallet)
    els.claimDone.classList.toggle('hidden', !pull.claimed || pull.result_type !== 'free_booger')

    if (pull.claimed && pull.wallet_address) {
      els.claimDone.textContent = `Claimed with ${pull.wallet_address.slice(0, 6)}…${pull.wallet_address.slice(-4)}`
    }

    els.shareBtn.dataset.shareText = display.shareText
    setPhase(pull ? 'result' : 'result')
    els.panels.gate.classList.add('hidden')
  }

  function showResultForPull(pull: TissuePull): void {
    if (els.emailInput) els.emailInput.disabled = true
    els.pullBtn.disabled = true
    renderResult(pull)
    setPhase(demo ? 'result' : 'already_pulled')
  }

  async function handlePull(): Promise<void> {
    if (isPulling || phase === 'pulling') return

    if (!demo) {
      if (!els.emailInput) return
      email = normalizeEmail(els.emailInput.value || email)
      if (!isValidEmail(email)) {
        els.emailInput.classList.add('invalid')
        return
      }
      els.emailInput.classList.remove('invalid')

      const existing = findPullByEmail(email)
      if (existing) {
        setSessionEmail(email)
        showResultForPull(existing)
        return
      }
    } else {
      email = 'demo@toph.preview'
    }

    const inv = getInventory()
    if (inv.tissuesLeft <= 0) {
      setPhase('sold_out')
      return
    }

    isPulling = true
    els.pullBtn.disabled = true
    if (els.emailInput) els.emailInput.disabled = true
    setPhase('pulling')

    try {
      // Result saved immediately (mock). Production: server returns pull + inventory.
      const { pull, inventory } = await executePull(email)
      updateStats(inventory)
      if (!demo) setSessionEmail(email)
      currentPull = pull

      callbacks.onPullStart(pull)
    } catch (err) {
      isPulling = false
      els.pullBtn.disabled = false
      if (els.emailInput) els.emailInput.disabled = false
      setPhase('landing')
      alert(err instanceof Error ? err.message : 'Pull failed.')
    }
  }

  function finishPull(pull: TissuePull): void {
    isPulling = false
    renderResult(pull)
    if (demo) {
      setPhase('result')
    } else {
      els.pullBtn.disabled = true
      if (els.emailInput) els.emailInput.disabled = true
      setPhase('already_pulled')
    }
  }

  async function handleWallet(): Promise<void> {
    if (!currentPull) return

    // PRODUCTION: replace with Phantom / wagmi / Wallet Standard
    const mockWallet = prompt(
      'Mock wallet connect — paste a wallet address (production: real connector):',
      '0xBooger' + Math.random().toString(16).slice(2, 10),
    )
    if (!mockWallet) return

    try {
      const updated = await claimWithWallet(currentPull.id, mockWallet)
      currentPull = updated
      renderResult(updated)
      els.walletBtn.disabled = true
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Claim failed.')
    }
  }

  async function handleShare(): Promise<void> {
    const text = els.shareBtn.dataset.shareText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      els.shareFeedback.classList.remove('hidden')
      setTimeout(() => els.shareFeedback.classList.add('hidden'), 2200)
    } catch {
      prompt('Copy your share text:', text)
    }
  }

  if (els.emailInput) {
    els.emailInput.addEventListener('input', () => {
      const ok = isValidEmail(els.emailInput!.value)
      els.pullBtn.disabled = !ok || getInventory().tissuesLeft <= 0 || isPulling
      if (ok) els.emailInput!.classList.remove('invalid')
    })

    els.emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !els.pullBtn.disabled) void handlePull()
    })
  }

  els.pullBtn.addEventListener('click', () => void handlePull())
  els.againBtn?.addEventListener('click', prepareAnotherPull)
  els.resetDemoBtn?.addEventListener('click', () => {
    resetDemoBox()
    refreshCounters()
    prepareAnotherPull()
  })
  els.walletBtn.addEventListener('click', () => void handleWallet())
  els.shareBtn.addEventListener('click', () => void handleShare())

  // Returning visitor (real mode only)
  if (!demo && email && els.emailInput) {
    els.emailInput.value = email
    const existing = findPullByEmail(email)
    if (existing) showResultForPull(existing)
  }

  els.pullBtn.textContent =
    PULL_BUTTON_LABELS[
      Math.floor(Math.random() * PULL_BUTTON_LABELS.length)
    ]

  refreshCounters()
  if (!demo && els.emailInput) {
    els.pullBtn.disabled =
      !isValidEmail(els.emailInput.value) || getInventory().tissuesLeft <= 0
  } else if (demo) {
    els.pullBtn.disabled = getInventory().tissuesLeft <= 0
  }

  return {
    root,
    getPhase: () => phase,
    refreshCounters,
    showResultForPull,
    finishPull,
  }
}
