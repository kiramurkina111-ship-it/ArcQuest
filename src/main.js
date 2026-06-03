const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  delivered: document.querySelector("#delivered"),
  score: document.querySelector("#score"),
  fees: document.querySelector("#fees"),
  clock: document.querySelector("#clock"),
  toast: document.querySelector("#toast"),
  lesson: document.querySelector("#lesson"),
  homeScreen: document.querySelector("#homeScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  levelGrid: document.querySelector("#levelGrid"),
  levelDialog: document.querySelector("#levelDialog"),
  levelTag: document.querySelector("#levelTag"),
  levelTitle: document.querySelector("#levelTitle"),
  levelTech: document.querySelector("#levelTech"),
  levelObjective: document.querySelector("#levelObjective"),
  levelMechanics: document.querySelector("#levelMechanics"),
  levelReadMore: document.querySelector("#levelReadMore"),
  startLevel: document.querySelector("#startLevel"),
  closeLevel: document.querySelector("#closeLevel"),
  backToMenu: document.querySelector("#backToMenu"),
  homeConnectWallet: document.querySelector("#homeConnectWallet"),
  homeBadges: document.querySelector("#homeBadges"),
  levelBadges: document.querySelector("#levelBadges"),
  connectWallet: document.querySelector("#connectWallet"),
  missionHint: document.querySelector("#missionHint"),
  missionObjective: document.querySelector("#missionObjective"),
  goalCopy: document.querySelector("#goalCopy"),
  mintDialog: document.querySelector("#mintDialog"),
  nicknameInput: document.querySelector("#nicknameInput"),
  mintStatus: document.querySelector("#mintStatus"),
  badgePreviewMission: document.querySelector("#badgePreviewMission"),
  badgePreviewLevel: document.querySelector("#badgePreviewLevel"),
  badgePreviewNickname: document.querySelector("#badgePreviewNickname"),
  badgePreviewScore: document.querySelector("#badgePreviewScore"),
  confirmMint: document.querySelector("#confirmMint"),
  cancelMint: document.querySelector("#cancelMint"),
  nextLevelFromMint: document.querySelector("#nextLevelFromMint"),
  badgesDialog: document.querySelector("#badgesDialog"),
  badgesStatus: document.querySelector("#badgesStatus"),
  badgesGrid: document.querySelector("#badgesGrid"),
  refreshBadges: document.querySelector("#refreshBadges"),
  closeBadges: document.querySelector("#closeBadges"),
  restart: document.querySelector("#restart"),
  mint: document.querySelector("#mint"),
  dialog: document.querySelector("#completeDialog"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCopy: document.querySelector("#resultCopy"),
  finalScore: document.querySelector("#finalScore"),
  playAgain: document.querySelector("#playAgain"),
  nextStep: document.querySelector("#nextStep")
};

const ARC_TESTNET = {
  chainId: "0x4CEF52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"]
};

const ACHIEVEMENT_CONTRACT_ADDRESS = "0x8B55474a2153706370EEe68B22046847E8AF0AF4";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = `0x${"0".repeat(64)}`;
const TOKEN_URI_SELECTOR = "0xc87b56dd";
const OWNER_OF_SELECTOR = "0x6352211e";

const levels = [
  {
    id: 1,
    title: "Pay the Grid",
    concept: "USDC gas and stable fee routing",
    tech: "Arc uses USDC as native gas, so payment apps can reason about fees in dollars instead of volatile token units.",
    mechanics: "Each delivered payment adds non-burnable points. Faster routing and lower fees earn a higher reward.",
    objective: "Route five USDC payments through a shifting network while avoiding fake claim routes.",
    docsUrl: "https://docs.arc.io/arc/concepts/stablecoin-native-model",
    implemented: true
  },
  {
    id: 2,
    title: "Finality Rush",
    concept: "Sub-second deterministic settlement",
    tech: "Arc transactions finalize deterministically, which helps payment apps avoid reorg risk and uncertain settlement windows.",
    mechanics: "Sending a payment is not the same as final settlement. Route each invoice through a lane that can reach finality before its deadline without breaking the fee budget.",
    objective: "Finalize at least four payments before two invoices expire while staying under the $0.09 fee budget.",
    docsUrl: "https://docs.arc.io/arc/concepts/consensus-layer",
    implemented: true
  },
  {
    id: 3,
    title: "StableFX Corridor",
    concept: "Stablecoin FX and cross-currency routing",
    tech: "Arc's stablecoin-native model makes FX feel like a payment workflow: route value, control dollar costs, and settle into the right currency.",
    mechanics: "Build a 100% FX quote by allocating 25% chunks across corridors. Split flow lowers slippage, but every corridor has its own fee, speed, liquidity, and deadline tradeoff.",
    objective: "Settle four cross-currency quotes before two requests fail while staying under the fee budget.",
    docsUrl: "https://docs.arc.io/arc/concepts/stablecoin-native-model",
    implemented: true
  },
  {
    id: 4,
    title: "Agent Escrow",
    concept: "Agentic commerce and programmable settlement",
    tech: "Arc can support AI agents that coordinate work, escrow value, and settle outcomes in stablecoins.",
    mechanics: "Fund only verified agent jobs and avoid releasing escrow into fake work routes.",
    objective: "Fund agent jobs, verify completion, and release stablecoin payments.",
    docsUrl: "https://docs.arc.io/build/agentic-economy",
    implemented: false
  },
  {
    id: 5,
    title: "Privacy Audit",
    concept: "Opt-in privacy and selective disclosure",
    tech: "Arc's privacy roadmap focuses on shielding sensitive transaction details while preserving auditability for approved viewers.",
    mechanics: "Choose disclosure paths that protect sensitive data without failing audit checks.",
    objective: "Route confidential business payments without breaking auditor visibility.",
    docsUrl: "https://docs.arc.io/arc/concepts/opt-in-privacy",
    implemented: false
  },
  {
    id: 6,
    title: "Achievement Mint",
    concept: "Onchain progress and ERC-721 badges",
    tech: "Completed missions can become testnet NFT achievements that preserve learning progress on Arc.",
    mechanics: "Mint achievements with your nickname and best score after completing the mission path.",
    objective: "Mint a proof-of-learning badge after completing the training path.",
    docsUrl: "https://docs.arc.io/arc/developers",
    implemented: false
  }
];

const nodeTemplates = [
  { id: "treasury", label: "USDC Treasury", type: "source", x: [145, 185], y: [230, 310] },
  { id: "stable", label: "Stable Route", type: "route", x: [285, 380], y: [120, 215] },
  { id: "fast", label: "Fast Lane", type: "route", x: [285, 380], y: [325, 430] },
  { id: "fx", label: "FX Gate", type: "route", x: [535, 650], y: [105, 215] },
  { id: "agent", label: "Agent Node", type: "route", x: [535, 650], y: [325, 430] },
  { id: "merchant", label: "Merchant", type: "target", x: [790, 850], y: [230, 310] },
  { id: "scam", label: "Fake Claim", type: "scam", x: [690, 760], y: [115, 425] }
];

let nodes = [];
let edges = [];
let nodeById = new Map();

const lessons = [
  "Arc uses USDC for gas, so payment apps can reason about fees in dollars instead of volatile native tokens.",
  "Stable routes are slower sometimes, but predictable fees are valuable for checkout and treasury workflows.",
  "A fast route is useful when settlement speed matters, but it still needs clear dollar-denominated costs.",
  "A suspicious zero-fee shortcut can be a scam path. Good payment UX should make dangerous routes visible before users sign.",
  "FX corridors let apps think in payment outcomes: who receives value, in what currency, and at what cost.",
  "A learning badge can later be minted on Arc testnet as proof that you completed this mission."
];

const state = {
  current: "treasury",
  target: null,
  progress: 0,
  delivered: 0,
  score: 0,
  lastDeliveryAt: 60,
  totalFees: 0,
  timeLeft: 60,
  packet: { x: 120, y: 270 },
  route: null,
  hoveredNodeId: null,
  particles: [],
  wave: 1,
  screen: "home",
  selectedLevelId: 1,
  walletAddress: null,
  finished: false,
  mintedThisRun: false,
  lastTick: performance.now(),
  lessonIndex: 0
};

const finalityRush = window.ArcQuestLevels.createFinalityRush({
  state,
  ui,
  canvas,
  ctx,
  burst,
  updateParticles,
  pointerPosition,
  lerp,
  easeInOut,
  roundRect,
  drawUsdcMark,
  finishGame
});

const stableFxCorridor = window.ArcQuestLevels.createStableFxCorridor({
  state,
  ui,
  canvas,
  ctx,
  burst,
  updateParticles,
  pointerPosition,
  lerp,
  easeInOut,
  roundRect,
  drawUsdcMark,
  finishGame
});

function resetGame() {
  state.screen = "game";
  state.finished = false;
  state.mintedThisRun = false;
  state.lastTick = performance.now();
  ui.mint.disabled = true;
  ui.mint.textContent = "Mint Badge";
  ui.nextStep.disabled = false;
  ui.nextStep.textContent = "Mint Badge";
  ui.confirmMint.disabled = false;
  ui.confirmMint.textContent = "Mint Badge";
  ui.dialog.classList.remove("failed");
  ui.playAgain.textContent = "Play again";
  ui.toast.textContent = "Choose a route for the USDC packet.";
  ui.lesson.textContent = lessons[0];
  if (ui.dialog.open) {
    ui.dialog.close();
  }

  if (state.selectedLevelId === 2) {
    finalityRush.reset();
  } else if (state.selectedLevelId === 3) {
    stableFxCorridor.reset();
  } else {
    resetPayTheGrid();
  }

  syncUi();
}

function resetPayTheGrid() {
  state.wave = 1;
  generateWave();
  state.current = "treasury";
  state.target = null;
  state.progress = 0;
  state.delivered = 0;
  state.score = 0;
  state.lastDeliveryAt = 60;
  state.totalFees = 0;
  state.timeLeft = 60;
  state.packet = { ...nodeById.get("treasury") };
  state.route = null;
  state.hoveredNodeId = null;
  state.particles = [];
  state.lessonIndex = 0;
  ui.toast.textContent = "Choose a route for the USDC packet.";
  ui.lesson.textContent = lessons[0];
}

function savedProgress() {
  return Number(localStorage.getItem("arcquest-progress") || "0");
}

function saveProgress(levelId) {
  const nextProgress = Math.max(savedProgress(), levelId);
  localStorage.setItem("arcquest-progress", String(nextProgress));
}

function renderLevelGrid() {
  const progress = savedProgress();
  ui.levelGrid.innerHTML = "";

  for (const level of levels) {
    const isComplete = progress >= level.id;
    const isAvailable = level.implemented && (level.id === 1 || progress >= level.id - 1);
    const status = isComplete ? "Complete" : isAvailable ? "Open" : level.implemented ? "Locked" : "Locked";
    const card = document.createElement("button");
    card.type = "button";
    card.className = `level-card ${isComplete ? "complete" : ""} ${isAvailable ? "" : "locked"}`;
    card.style.setProperty("--level-index", String(level.id - 1));
    card.disabled = !isAvailable;
    card.innerHTML = `
      <span class="level-number">Mission ${String(level.id).padStart(2, "0")}</span>
      <h3>${level.title}</h3>
      <p>${level.concept}</p>
      <span class="level-status">${status}</span>
    `;
    card.addEventListener("click", () => openLevelBriefing(level.id));
    ui.levelGrid.append(card);
  }
}

function openLevelBriefing(levelId) {
  const level = levels.find((item) => item.id === levelId);
  if (!level || !level.implemented) {
    return;
  }

  state.selectedLevelId = level.id;
  ui.levelTag.textContent = `Mission ${String(level.id).padStart(2, "0")}`;
  ui.levelTitle.textContent = level.title;
  ui.levelTech.textContent = level.tech;
  ui.levelObjective.textContent = level.objective;
  ui.levelMechanics.textContent = level.mechanics;
  ui.levelReadMore.href = level.docsUrl;
  ui.levelReadMore.textContent = "Read more: Arc docs";
  ui.levelDialog.showModal();
}

function startSelectedLevel() {
  ui.levelDialog.close();
  ui.homeScreen.classList.add("hidden");
  ui.gameScreen.classList.remove("hidden");
  const level = levels.find((item) => item.id === state.selectedLevelId);
  document.querySelector(".topbar .eyebrow").textContent = `ArcQuest / Mission ${String(state.selectedLevelId).padStart(2, "0")}`;
  document.querySelector(".topbar h1").textContent = level.title;
  if (state.selectedLevelId === 2) {
    ui.missionHint.textContent = "Select an invoice, send it through a lane, then wait for final settlement";
    ui.missionObjective.textContent = "Sent ≠ Final";
    ui.goalCopy.textContent = "Finalize at least four payments before two invoices expire, while staying under the $0.09 fee budget. A payment only counts after it reaches final settlement.";
  } else if (state.selectedLevelId === 3) {
    ui.missionHint.textContent = "Build a 100% FX split, then settle before the quote window closes";
    ui.missionObjective.textContent = "Settle 4 FX quotes";
    ui.goalCopy.textContent = "Allocate each FX request across corridors in 25% chunks. Keep slippage inside tolerance, fees under $0.16, and settle before the quote window closes.";
  } else {
    ui.missionHint.textContent = "Click a glowing node, avoid fake claims";
    ui.missionObjective.textContent = "Route 5 shifting payments";
    ui.goalCopy.textContent = "Deliver five USDC payments before the timer runs out. Faster completion and lower total fees mean a higher score.";
  }
  resetGame();
}

function showHome() {
  state.screen = "home";
  state.route = null;
  state.hoveredNodeId = null;
  canvas.style.cursor = "default";
  ui.gameScreen.classList.add("hidden");
  ui.homeScreen.classList.remove("hidden");
  if (ui.dialog.open) {
    ui.dialog.close();
  }
  renderLevelGrid();
}

function contractConfigured() {
  return !/^0x0{40}$/i.test(ACHIEVEMENT_CONTRACT_ADDRESS);
}

async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Install MetaMask, Rabby, or another EVM wallet first.");
  }

  await ensureArcNetwork();
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  state.walletAddress = accounts[0] || null;
  updateWalletUi();
  return state.walletAddress;
}

async function ensureArcNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainId }]
    });
  } catch (error) {
    if (error.code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_TESTNET]
    });
  }
}

function updateWalletUi() {
  const label = state.walletAddress ? shortAddress(state.walletAddress) : "Connect wallet";
  ui.connectWallet.textContent = label;
  ui.homeConnectWallet.textContent = label;
}

function setWalletButtonLabel(label) {
  ui.connectWallet.textContent = label;
  ui.homeConnectWallet.textContent = label;
}

async function handleWalletConnectClick() {
  try {
    setWalletButtonLabel("Connecting...");
    const account = await connectWallet();
    if (!account) {
      throw new Error("Wallet did not return an account.");
    }
  } catch (error) {
    const message = walletErrorMessage(error);
    showWalletError(message);
    updateWalletUi();
  }
}

function walletErrorMessage(error) {
  if (error?.code === 4001) {
    return "Wallet request was rejected.";
  }
  return error?.message || "Wallet connection failed.";
}

function showWalletError(message) {
  setMintStatus(message, "error");
  if (state.screen === "game") {
    ui.toast.textContent = message;
    return;
  }
  window.alert(message);
}

async function openBadgesDialog() {
  ui.badgesDialog.showModal();
  await refreshBadges();
}

async function refreshBadges() {
  ui.badgesStatus.textContent = "Loading badges from Arc testnet...";
  ui.badgesGrid.innerHTML = "";

  try {
    if (!contractConfigured()) {
      ui.badgesStatus.textContent = "Contract address is not configured yet.";
      return;
    }

    const account = state.walletAddress || (await connectWallet());
    if (!account) {
      ui.badgesStatus.textContent = "Connect a wallet to load your badges.";
      return;
    }

    await ensureArcNetwork();
    const badges = await loadBadges(account);
    renderBadges(badges);
  } catch (error) {
    ui.badgesStatus.textContent = walletErrorMessage(error);
  }
}

function openMintDialog() {
  if (state.score <= 0) {
    return;
  }

  if (ui.dialog.open) {
    ui.dialog.close();
  }

  ui.nicknameInput.value = localStorage.getItem("arcquest-nickname") || "";
  updateBadgePreview();
  updateMintButtons();
  updateNextLevelButton();
  setMintStatus(
    contractConfigured()
      ? "Enter a nickname, connect Arc testnet, and mint your badge."
      : "Deploy the contract first, then paste its address into ACHIEVEMENT_CONTRACT_ADDRESS.",
    contractConfigured() ? "" : "error"
  );
  ui.mintDialog.showModal();
}

async function mintAchievementNft() {
  if (state.mintedThisRun) {
    setMintStatus("This run already minted a badge.", "success");
    return;
  }

  const nickname = ui.nicknameInput.value.trim();
  if (!validNickname(nickname)) {
    setMintStatus("Nickname must be 2-24 chars: letters, numbers, dot, dash, or underscore.", "error");
    return;
  }

  if (!contractConfigured()) {
    setMintStatus("Contract address is not configured yet. Deploy it and update src/main.js.", "error");
    return;
  }

  try {
    ui.confirmMint.disabled = true;
    localStorage.setItem("arcquest-nickname", nickname);
    updateBadgePreview();
    setMintStatus("Waiting for wallet confirmation...", "");
    const account = state.walletAddress || (await connectWallet());
    if (!account) return;
    const tx = {
      from: account,
      to: ACHIEVEMENT_CONTRACT_ADDRESS,
      data: encodeMintData(state.selectedLevelId, Math.round(state.score), nickname)
    };

    setMintStatus("Checking whether this badge can be minted...", "");
    await preflightMint(tx);

    setMintStatus("Waiting for wallet confirmation...", "");
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [tx]
    });

    setMintTransactionStatus(txHash, "Transaction sent. Waiting for Arc finality...");
    const receipt = await waitForReceipt(txHash);
    if (!receipt) {
      throw new Error("Transaction was sent, but the receipt is not visible yet. Check the explorer link.");
    }
    if (receipt?.status === "0x0") {
      throw new Error("Transaction failed onchain.");
    }
    state.mintedThisRun = true;
    updateMintButtons();
    setMintTransactionStatus(txHash, "Minted. View transaction");
  } catch (error) {
    setMintStatus(mintErrorMessage(error), "error");
  } finally {
    ui.confirmMint.disabled = state.mintedThisRun;
  }
}

async function preflightMint(tx) {
  try {
    await window.ethereum.request({
      method: "eth_call",
      params: [tx, "latest"]
    });
  } catch (error) {
    throw new Error(preflightMintErrorMessage(error));
  }
}

function encodeMintData(levelId, score, nickname) {
  const encodedNickname = Array.from(new TextEncoder().encode(nickname));
  const bytes = [0x01, levelId & 0xff, (score >> 8) & 0xff, score & 0xff, ...encodedNickname];
  return `0x${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function waitForReceipt(txHash) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const receipt = await window.ethereum.request({
      method: "eth_getTransactionReceipt",
      params: [txHash]
    });
    if (receipt) {
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  return null;
}

function setMintStatus(message, type) {
  ui.mintStatus.textContent = message;
  ui.mintStatus.classList.toggle("success", type === "success");
  ui.mintStatus.classList.toggle("error", type === "error");
}

function setMintTransactionStatus(txHash, label) {
  ui.mintStatus.textContent = "";
  ui.mintStatus.append(document.createTextNode(`${label}: `));
  const link = document.createElement("a");
  link.href = `https://testnet.arcscan.app/tx/${txHash}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${txHash.slice(0, 10)}...${txHash.slice(-6)}`;
  ui.mintStatus.append(link);
  ui.mintStatus.classList.add("success");
  ui.mintStatus.classList.remove("error");
}

function mintErrorMessage(error) {
  const message = error?.message || "Mint failed.";
  if (message.includes("AlreadyMinted") || message.includes("already minted") || message.includes("already minted a badge") || message.includes("0x62f8b794")) {
    return "This wallet already minted a badge for this level.";
  }
  return message;
}

function preflightMintErrorMessage(error) {
  const message = error?.message || "";
  const data = String(error?.data?.data || error?.data || "");

  if (message.includes("AlreadyMinted") || data.includes("62f8b794")) {
    return "This wallet already minted a badge for this level. Try the next level or use a different wallet.";
  }

  if (message.includes("InvalidNickname")) {
    return "Nickname is invalid. Use 2-24 letters, numbers, dot, dash, or underscore.";
  }

  if (message.includes("InvalidScore")) {
    return "Score is outside the contract limits. Replay the level and try again.";
  }

  return "The contract rejected this mint before wallet confirmation. Most likely this wallet already minted this level, or the transaction would revert.";
}

function updateBadgePreview() {
  const level = levels.find((item) => item.id === state.selectedLevelId);
  const nickname = ui.nicknameInput.value.trim() || "Nickname";
  ui.badgePreviewMission.textContent = `Mission ${String(state.selectedLevelId).padStart(2, "0")}`;
  ui.badgePreviewLevel.textContent = level?.title || "ArcQuest";
  ui.badgePreviewNickname.textContent = nickname;
  ui.badgePreviewScore.textContent = Math.round(state.score).toString();
}

function updateMintButtons() {
  const label = state.mintedThisRun ? "Minted" : "Mint Badge";
  ui.confirmMint.textContent = label;
  ui.confirmMint.disabled = state.mintedThisRun;
  ui.mint.textContent = label;
  ui.mint.disabled = state.mintedThisRun || !state.finished || state.score <= 0;
  ui.nextStep.textContent = label;
  ui.nextStep.disabled = state.mintedThisRun || !state.finished || state.score <= 0;
}

function updateNextLevelButton() {
  const nextLevel = levels.find((level) => level.id === state.selectedLevelId + 1);
  const canOpenNext = Boolean(nextLevel?.implemented) && savedProgress() >= state.selectedLevelId;
  ui.nextLevelFromMint.disabled = !canOpenNext;
  ui.nextLevelFromMint.textContent = canOpenNext ? "Next level" : "Next level locked";
}

function goToNextLevel() {
  const nextLevel = levels.find((level) => level.id === state.selectedLevelId + 1);
  if (!nextLevel?.implemented || savedProgress() < state.selectedLevelId) {
    return;
  }

  if (ui.mintDialog.open) {
    ui.mintDialog.close();
  }

  state.selectedLevelId = nextLevel.id;
  ui.homeScreen.classList.remove("hidden");
  ui.gameScreen.classList.add("hidden");
  state.screen = "home";
  renderLevelGrid();
  openLevelBriefing(nextLevel.id);
}

async function loadBadges(account) {
  let tokenIds = [];

  try {
    tokenIds = await loadBadgeTokenIdsFromLogs(account);
  } catch (error) {
    console.warn("Could not load badges from mint logs. Falling back to token owner scan.", error);
    tokenIds = await loadBadgeTokenIdsByOwnerScan(account);
  }

  const badges = [];

  for (const tokenId of tokenIds) {
    try {
      const metadata = await loadTokenMetadata(tokenId);
      badges.push({ tokenId, metadata });
    } catch (error) {
      console.warn(`Could not load metadata for token ${tokenId}`, error);
    }
  }

  return badges.sort((a, b) => a.tokenId - b.tokenId);
}

async function loadBadgeTokenIdsFromLogs(account) {
  const logs = await window.ethereum.request({
    method: "eth_getLogs",
    params: [
      {
        address: ACHIEVEMENT_CONTRACT_ADDRESS,
        fromBlock: "0x0",
        toBlock: "latest",
        topics: [TRANSFER_TOPIC, ZERO_TOPIC, addressTopic(account)]
      }
    ]
  });

  const tokenIds = [...new Set(logs.map((log) => hexToNumber(log.topics[3])).filter(Number.isFinite))];
  const ownedTokenIds = [];

  for (const tokenId of tokenIds) {
    if (await tokenOwnedBy(tokenId, account)) {
      ownedTokenIds.push(tokenId);
    }
  }

  return ownedTokenIds;
}

async function loadBadgeTokenIdsByOwnerScan(account) {
  const nextTokenId = await loadNextTokenIdFromStorage();
  const ownedTokenIds = [];

  for (let tokenId = 1; tokenId < nextTokenId; tokenId += 1) {
    if (await tokenOwnedBy(tokenId, account)) {
      ownedTokenIds.push(tokenId);
    }
  }

  return ownedTokenIds;
}

async function loadNextTokenIdFromStorage() {
  const result = await window.ethereum.request({
    method: "eth_getStorageAt",
    params: [ACHIEVEMENT_CONTRACT_ADDRESS, "0x0", "latest"]
  });
  const nextTokenId = hexToNumber(result);
  return Number.isFinite(nextTokenId) && nextTokenId > 0 ? nextTokenId : 1;
}

async function tokenOwnedBy(tokenId, account) {
  try {
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: ACHIEVEMENT_CONTRACT_ADDRESS,
          data: `${OWNER_OF_SELECTOR}${uint256Hex(tokenId)}`
        },
        "latest"
      ]
    });
    return decodeAbiAddress(result).toLowerCase() === account.toLowerCase();
  } catch (error) {
    return false;
  }
}

async function loadTokenMetadata(tokenId) {
  const result = await window.ethereum.request({
    method: "eth_call",
    params: [
      {
        to: ACHIEVEMENT_CONTRACT_ADDRESS,
        data: `${TOKEN_URI_SELECTOR}${uint256Hex(tokenId)}`
      },
      "latest"
    ]
  });
  const tokenUri = decodeAbiString(result);
  const metadata = JSON.parse(decodeDataUri(tokenUri));
  return metadata;
}

function renderBadges(badges) {
  ui.badgesGrid.innerHTML = "";

  if (badges.length === 0) {
    ui.badgesStatus.textContent = "No minted badges found for this wallet yet.";
    const empty = document.createElement("div");
    empty.className = "empty-badges";
    empty.textContent = "Complete a mission and mint a badge to see it here.";
    ui.badgesGrid.append(empty);
    return;
  }

  ui.badgesStatus.textContent = `Found ${badges.length} badge${badges.length === 1 ? "" : "s"} on Arc testnet.`;

  for (const badge of badges) {
    const card = document.createElement("figure");
    card.className = "badge-owned-card";

    const image = document.createElement("img");
    image.src = badge.metadata.image;
    image.alt = badge.metadata.name || `ArcQuest badge #${badge.tokenId}`;

    const caption = document.createElement("figcaption");
    const title = document.createElement("strong");
    title.textContent = badge.metadata.name || `ArcQuest Badge #${badge.tokenId}`;

    const token = document.createElement("span");
    token.textContent = `Token #${badge.tokenId}`;

    const level = document.createElement("span");
    level.textContent = `Level: ${attributeValue(badge.metadata, "Level") || "ArcQuest"}`;

    const score = document.createElement("span");
    score.textContent = `Score: ${attributeValue(badge.metadata, "Score") || "--"}`;

    const nickname = document.createElement("span");
    nickname.textContent = `Nickname: ${attributeValue(badge.metadata, "Nickname") || "--"}`;

    const link = document.createElement("a");
    link.href = `https://testnet.arcscan.app/token/${ACHIEVEMENT_CONTRACT_ADDRESS}?a=${badge.tokenId}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open in ArcScan";

    caption.append(title, token, level, score, nickname, link);
    card.append(image, caption);
    ui.badgesGrid.append(card);
  }
}

function attributeValue(metadata, traitType) {
  return metadata.attributes?.find((attribute) => attribute.trait_type === traitType)?.value;
}

function addressTopic(address) {
  return `0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

function uint256Hex(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function hexToNumber(hex) {
  if (!hex || hex === "0x") {
    return 0;
  }
  return Number(BigInt(hex));
}

function decodeAbiAddress(hex) {
  const clean = hex.replace(/^0x/, "").padStart(64, "0");
  return `0x${clean.slice(-40)}`;
}

function decodeAbiString(hex) {
  const clean = hex.replace(/^0x/, "");
  if (clean.length < 128) {
    return "";
  }

  const offset = Number.parseInt(clean.slice(0, 64), 16);
  const lengthStart = offset * 2;
  const length = Number.parseInt(clean.slice(lengthStart, lengthStart + 64), 16);
  const dataStart = lengthStart + 64;
  const data = clean.slice(dataStart, dataStart + length * 2);
  const bytes = data.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function decodeDataUri(uri) {
  if (uri.startsWith("data:application/json;base64,")) {
    const [, encoded = ""] = uri.split(",");
    return atob(encoded);
  }

  if (uri.startsWith("data:application/json;utf8,")) {
    return decodeURIComponent(uri.slice("data:application/json;utf8,".length));
  }

  return uri;
}

function validNickname(nickname) {
  return /^[A-Za-z0-9._-]{2,24}$/.test(nickname);
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function availableEdges() {
  return edges.filter((edge) => edge.from === state.current);
}

function generateWave() {
  const scamVisible = state.wave > 1 && Math.random() > 0.35;
  nodes = nodeTemplates
    .filter((template) => template.id !== "scam" || scamVisible)
    .map((template) => ({
      id: template.id,
      label: template.label,
      type: template.type,
      x: randomInt(template.x[0], template.x[1]),
      y: randomInt(template.y[0], template.y[1])
    }));
  nodeById = new Map(nodes.map((node) => [node.id, node]));
  edges = buildRouteGraph(scamVisible);
}

function buildRouteGraph(scamVisible) {
  const firstTargets = shuffle(["stable", "fast"]);
  const stableExit = Math.random() > 0.45 ? "fx" : "agent";
  const fastExit = stableExit === "fx" ? "agent" : "fx";
  const routes = [
    makeEdge("treasury", firstTargets[0], "stable"),
    makeEdge("treasury", firstTargets[1], Math.random() > 0.5 ? "stable" : "variable"),
    makeEdge("stable", stableExit, Math.random() > 0.4 ? "stable" : "variable"),
    makeEdge("fast", fastExit, Math.random() > 0.35 ? "stable" : "variable"),
    makeEdge("fx", "merchant", Math.random() > 0.25 ? "stable" : "variable"),
    makeEdge("agent", "merchant", Math.random() > 0.55 ? "stable" : "variable")
  ];

  if (Math.random() > 0.45) {
    routes.push(makeEdge("stable", fastExit, "variable"));
  }
  if (Math.random() > 0.45) {
    routes.push(makeEdge("fast", stableExit, "variable"));
  }
  if (scamVisible) {
    routes.push(makeScamEdge(randomItem(["treasury", "stable", "fast", "fx", "agent"])));
  }

  return dedupeEdges(routes);
}

function makeEdge(from, to, kind) {
  const stable = kind === "stable";
  return {
    from,
    to,
    fee: stable ? randomFee(0.01, 0.03) : randomFee(0.04, 0.1),
    speed: stable ? randomFloat(1.15, 1.55) : randomFloat(1.35, 1.9),
    stable,
    scam: false
  };
}

function makeScamEdge(from) {
  return {
    from,
    to: "scam",
    fee: 0,
    speed: randomFloat(1.8, 2.15),
    stable: false,
    scam: true
  };
}

function dedupeEdges(routes) {
  const seen = new Set();
  return routes.filter((edge) => {
    const key = `${edge.from}-${edge.to}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function startRoute(edge) {
  if (state.route || state.finished) {
    return;
  }

  const actualFee = edge.scam ? 0 : edge.stable ? edge.fee : Number((edge.fee * (1.2 + Math.random() * 1.6)).toFixed(2));
  state.route = { ...edge, actualFee };
  state.target = edge.to;
  state.progress = 0;
  state.hoveredNodeId = null;
  canvas.style.cursor = "default";
  state.totalFees += actualFee;
  state.lessonIndex = Math.min(lessons.length - 1, state.lessonIndex + 1);
  ui.lesson.textContent = lessons[state.lessonIndex];

  const routeKind = edge.scam ? "scam" : edge.stable ? "stable" : "unstable";
  ui.toast.textContent = edge.scam
    ? "Scam transaction selected. This route looks too good for a reason."
    : `${routeKind} route selected: $${actualFee.toFixed(2)} fee. Watch the USDC packet settle.`;
  syncUi();
}

function completeRoute() {
  const completedRoute = state.route;
  state.current = state.target;
  state.target = null;
  state.route = null;
  state.progress = 0;

  if (state.current === "scam") {
    burst(state.packet.x, state.packet.y, "#f85149", 24);
    finishGame(false, "scam");
    return;
  }

  if (state.current === "merchant") {
    state.delivered += 1;
    state.score += calculateDeliveryScore(completedRoute);
    state.lastDeliveryAt = state.timeLeft;
    burst(state.packet.x, state.packet.y, "#58a6ff", 18);
    ui.toast.textContent = "Payment settled. The network shifted and a fresh USDC packet is ready.";
    state.wave += 1;
    generateWave();
    state.current = "treasury";
    state.packet = { ...nodeById.get("treasury") };
  }

  if (state.delivered >= 5) {
    finishGame(true);
  }
}

function finishGame(won, reason = "timeout") {
  state.finished = true;
  state.route = null;
  if (won) {
    saveProgress(state.selectedLevelId);
    renderLevelGrid();
  }
  ui.resultTitle.textContent = won ? "Mission complete" : "Mission failed";
  ui.resultCopy.textContent = won
    ? state.selectedLevelId === 3
      ? "You settled the FX corridor and learned how stablecoin payments depend on fee clarity, liquidity, slippage tolerance, and timely settlement."
      : state.selectedLevelId === 2
      ? "You finalized the payment queue and learned why deterministic settlement matters for time-sensitive commerce."
      : "You delivered the payments and learned why stable, dollar-denominated fees matter for commerce."
    : reason === "scam"
      ? "The packet was sent into a fake claim route. In stablecoin apps, a zero-fee shortcut can be a trap."
      : reason === "slippage"
        ? "Too many FX quotes failed because slippage exceeded the recipient tolerance. Try mixing corridors instead of draining one route."
      : reason === "expired"
        ? state.selectedLevelId === 3
          ? "Too many FX payments expired before settlement. Try prioritizing urgent corridors earlier."
          : "Too many payments expired before settlement. Try prioritizing urgent invoices and faster finality lanes."
        : state.selectedLevelId === 2
          ? "The settlement window closed before enough invoices finalized. Try using faster lanes for urgent payments."
          : state.selectedLevelId === 3
            ? "The FX window closed before enough payments settled. Watch deadlines, liquidity, and quoted slippage."
          : "The payment window expired before all five USDC packets settled. Try choosing faster or more predictable routes.";
  ui.finalScore.textContent = state.score.toString();
  ui.mint.disabled = !won;
  ui.mint.textContent = won ? "Mint Badge" : "Badge locked";
  ui.nextStep.disabled = !won;
  ui.nextStep.textContent = won ? "Mint Badge" : "Try again first";
  ui.playAgain.textContent = won ? "Play again" : "Try again";
  ui.dialog.classList.toggle("failed", !won);
  ui.toast.textContent = won
    ? "Mission complete. You can mint your achievement badge."
    : reason === "scam"
      ? "Scam route hit. Restart and avoid fake claims."
      : reason === "slippage"
        ? "FX quote failed twice. Restart and balance liquidity with tolerance."
      : reason === "expired"
        ? state.selectedLevelId === 3
          ? "Too many FX payments expired. Restart and route urgent corridors first."
          : "Too many payments expired. Restart and prioritize urgent settlement."
      : "Time ran out. Restart and try a more predictable route.";
  syncUi();
  ui.dialog.showModal();
}

function update(delta) {
  if (state.screen !== "game") {
    updateParticles(delta);
    return;
  }

  if (state.finished) {
    return;
  }

  if (state.selectedLevelId === 2) {
    finalityRush.update(delta);
    return;
  }
  if (state.selectedLevelId === 3) {
    stableFxCorridor.update(delta);
    return;
  }

  state.timeLeft = Math.max(0, state.timeLeft - delta / 1000);
  if (state.timeLeft <= 0) {
    finishGame(false);
    return;
  }

  if (!state.route) {
    syncPacketToNode();
    updateParticles(delta);
    return;
  }

  const from = nodeById.get(state.route.from);
  const to = nodeById.get(state.route.to);
  state.progress = Math.min(1, state.progress + (delta / 1000) * state.route.speed * 0.5);
  state.packet.x = lerp(from.x, to.x, easeInOut(state.progress));
  state.packet.y = lerp(from.y, to.y, easeInOut(state.progress));
  if (Math.random() > 0.55) {
    state.particles.push({
      x: state.packet.x,
      y: state.packet.y,
      vx: -10 + Math.random() * 20,
      vy: -10 + Math.random() * 20,
      life: 420,
      color: state.route.scam ? "#f85149" : state.route.stable ? "#58a6ff" : "#a371f7"
    });
  }
  updateParticles(delta);

  if (state.progress >= 1) {
    completeRoute();
  }
}

function syncPacketToNode() {
  const current = nodeById.get(state.current);
  state.packet.x = current.x;
  state.packet.y = current.y;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (state.selectedLevelId === 2) {
    finalityRush.draw();
    return;
  }
  if (state.selectedLevelId === 3) {
    stableFxCorridor.draw();
    return;
  }
  drawEdges();
  drawParticles();
  drawNodes();
  drawPacket();
  drawHoverTooltip();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#060a1c");
  gradient.addColorStop(0.55, "#0a1430");
  gradient.addColorStop(1, "#071f46");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width * 0.78, canvas.height * 0.18, 0, canvas.width * 0.78, canvas.height * 0.18, 420);
  glow.addColorStop(0, "rgba(61, 111, 255, 0.16)");
  glow.addColorStop(1, "rgba(61, 111, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.82, canvas.height * 1.08, 360, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
}

function drawEdges() {
  for (const edge of edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    const isAvailable = !state.route && edge.from === state.current && !state.finished;
    const isHovered = edge.to === state.hoveredNodeId && isAvailable;
    const isActive =
      state.route &&
      state.route.from === edge.from &&
      state.route.to === edge.to;
    ctx.strokeStyle = isAvailable
      ? edge.scam
        ? "#f85149"
        : edge.stable
        ? "#58a6ff"
        : "#a371f7"
      : "rgba(139, 148, 158, 0.35)";
    ctx.lineWidth = isHovered ? 8 : isAvailable ? 5 : 3;
    ctx.setLineDash(edge.stable ? [] : edge.scam ? [4, 6] : [10, 8]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isActive) {
      drawActiveRouteBadge(edge);
    }
  }
}

function drawActiveRouteBadge(edge) {
  const label = edge.scam ? "scam route" : "settling";
  const width = edge.scam ? 92 : 76;
  const height = 26;
  const x = clamp(state.packet.x + 28, width / 2 + 10, canvas.width - width / 2 - 10);
  const y = clamp(state.packet.y - 30, height / 2 + 10, canvas.height - height / 2 - 10);

  ctx.fillStyle = edge.scam ? "rgba(1, 4, 9, 0.82)" : "rgba(1, 4, 9, 0.82)";
  roundRect(ctx, x - width / 2, y - height / 2, width, height, 6);
  ctx.fill();
  ctx.strokeStyle = edge.scam ? "rgba(248, 81, 73, 0.58)" : "rgba(88, 166, 255, 0.42)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = edge.scam ? "#ffb3b0" : "#cfe1ff";
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 0.5);
}

function drawNodes() {
  for (const node of nodes) {
    const isCurrent = node.id === state.current && !state.route;
    const isClickable = availableEdges().some((edge) => edge.to === node.id) && !state.route && !state.finished;
    const isHovered = state.hoveredNodeId === node.id && isClickable;
    const radius = node.type === "target" ? 38 : 32;
    const pulse = isClickable ? Math.sin(performance.now() / 180) * 3 : 0;

    ctx.shadowColor = isCurrent || isHovered ? "rgba(88, 166, 255, 0.82)" : "transparent";
    ctx.shadowBlur = isCurrent || isHovered ? 24 : 0;
    ctx.fillStyle = nodeColor(node, isClickable, isCurrent);
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isClickable ? "#ffffff" : "rgba(255, 255, 255, 0.36)";
    ctx.lineWidth = isHovered ? 5 : isClickable ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nodeIcon(node), node.x, node.y);

    drawNodeLabel(node, radius);
  }
}

function drawNodeLabel(node, radius) {
  const labelY = nodeLabelY(node, radius);
  const metrics = ctx.measureText(node.label);
  const width = metrics.width + 18;
  const height = 22;
  const labelX = clamp(node.x, width / 2 + 8, canvas.width - width / 2 - 8);

  ctx.fillStyle = "rgba(11, 16, 32, 0.72)";
  roundRect(ctx, labelX - width / 2, labelY - height / 2, width, height, 6);
  ctx.fill();
  ctx.fillStyle = "#f6f8fa";
  ctx.font = "800 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.label, labelX, labelY + 0.5);
}

function nodeLabelY(node, radius) {
  if (node.id === "stable" || node.id === "fx") {
    return node.y + radius + 26;
  }
  if (node.id === "fast" || node.id === "agent") {
    return node.y + radius + 24;
  }
  return node.y + radius + 26;
}

function drawPacket() {
  ctx.fillStyle = "#2775ca";
  ctx.shadowColor = "rgba(39, 117, 202, 0.9)";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(state.packet.x, state.packet.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawUsdcMark(state.packet.x, state.packet.y, 15);
}

function drawUsdcMark(x, y, radius) {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius - 5, Math.PI * 0.72, Math.PI * 1.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius - 5, -Math.PI * 0.28, Math.PI * 0.28);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", x, y + 1);
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 420);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHoverTooltip() {
  if (!state.hoveredNodeId || state.route || state.finished) {
    return;
  }

  const edge = availableEdges().find((route) => route.to === state.hoveredNodeId);
  if (!edge) {
    return;
  }

  const node = nodeById.get(edge.to);
  const title = `${nodeById.get(edge.from).label} -> ${node.label}`;
  const fee = edge.scam
    ? "Fee: $0.00 bait"
    : edge.stable ? `Fee: $${edge.fee.toFixed(2)} fixed` : `Fee: from $${edge.fee.toFixed(2)}, can spike`;
  const speed = `Speed: ${edge.speed >= 1.6 ? "fast" : edge.speed >= 1.3 ? "medium" : "steady"}`;
  const risk = `Risk: ${edge.scam ? "scam - instant fail" : edge.stable ? "low" : "variable"}`;
  const box = tooltipBox(node);

  ctx.fillStyle = "rgba(1, 4, 9, 0.88)";
  roundRect(ctx, box.x, box.y, box.width, box.height, 8);
  ctx.fill();
  ctx.strokeStyle = edge.scam ? "rgba(248, 81, 73, 0.9)" : edge.stable ? "rgba(88, 166, 255, 0.88)" : "rgba(163, 113, 247, 0.82)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = edge.scam ? "#f85149" : edge.stable ? "#58a6ff" : "#a371f7";
  ctx.font = "900 12px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(edge.scam ? "SCAM ROUTE" : edge.stable ? "PREDICTABLE ROUTE" : "VARIABLE ROUTE", box.x + 12, box.y + 10);

  ctx.fillStyle = "#f6f8fa";
  ctx.font = "900 13px Inter, sans-serif";
  ctx.fillText(title, box.x + 12, box.y + 30);

  ctx.fillStyle = "#c9d1d9";
  ctx.font = "800 12px Inter, sans-serif";
  ctx.fillText(fee, box.x + 12, box.y + 54);
  ctx.fillText(speed, box.x + 12, box.y + 74);
  ctx.fillText(risk, box.x + 12, box.y + 94);
}

function tooltipBox(node) {
  const width = 230;
  const height = 118;
  const margin = 14;
  const preferRight = node.x < canvas.width - width - 64;
  const x = preferRight ? node.x + 48 : node.x - width - 48;
  const y = clamp(node.y - height / 2, margin, canvas.height - height - margin);

  return { x, y, width, height };
}

function nodeColor(node, isClickable, isCurrent) {
  if (isCurrent) return "#1456d9";
  if (node.type === "scam") return isClickable ? "#1f6feb" : "#30363d";
  if (isClickable) return "#1f6feb";
  if (node.type === "target") return "#8957e5";
  if (node.type === "source") return "#2775ca";
  return "#30363d";
}

function nodeIcon(node) {
  if (node.type === "scam") return "GO";
  if (node.type === "source") return "USDC";
  if (node.type === "target") return "PAID";
  if (node.id === "fx") return "FX";
  if (node.id === "agent") return "AI";
  return "GO";
}

function syncUi() {
  const target = state.selectedLevelId === 2
    ? finalityRush.targetDeliveries
    : state.selectedLevelId === 3
      ? stableFxCorridor.targetDeliveries
      : 5;
  ui.delivered.textContent = `${state.delivered}/${target}`;
  ui.score.textContent = Math.round(state.score).toString();
  ui.fees.textContent = state.selectedLevelId === 2
    ? `$${state.totalFees.toFixed(2)}/$${finalityRush.feeBudget.toFixed(2)}`
    : state.selectedLevelId === 3
      ? `$${state.totalFees.toFixed(2)}/$${stableFxCorridor.feeBudget.toFixed(2)}`
      : `$${state.totalFees.toFixed(2)}`;
  ui.clock.textContent = `${Math.ceil(state.timeLeft)}s`;
}

function calculateDeliveryScore(completedRoute) {
  const secondsForPayment = Math.max(0, state.lastDeliveryAt - state.timeLeft);
  const speedScore = Math.max(1, 100 - (secondsForPayment / 60) * 99);
  const feePenalty = Math.min(70, completedRoute.actualFee * 220);
  return Math.max(1, Math.round(speedScore - feePenalty));
}

function updateParticles(delta) {
  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + (particle.vx * delta) / 1000,
      y: particle.y + (particle.vy * delta) / 1000,
      life: particle.life - delta
    }))
    .filter((particle) => particle.life > 0);
}

function burst(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    const speed = 45 + Math.random() * 55;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 520,
      color
    });
  }
}

function handleCanvasClick(event) {
  if (state.selectedLevelId === 2) {
    finalityRush.handleClick(event);
    return;
  }
  if (state.selectedLevelId === 3) {
    stableFxCorridor.handleClick(event);
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const clickedNode = nodes.find((node) => distance(x, y, node.x, node.y) <= 42);
  if (!clickedNode) {
    return;
  }

  const edge = availableEdges().find((route) => route.to === clickedNode.id);
  if (edge) {
    startRoute(edge);
  }
}

function handleCanvasMove(event) {
  if (state.selectedLevelId === 2) {
    finalityRush.handleMove(event);
    return;
  }
  if (state.selectedLevelId === 3) {
    stableFxCorridor.handleMove(event);
    return;
  }

  if (state.route || state.finished) {
    state.hoveredNodeId = null;
    canvas.style.cursor = "default";
    return;
  }

  const point = pointerPosition(event);
  const hoveredNode = nodes.find((node) => distance(point.x, point.y, node.x, node.y) <= 44);
  const edge = hoveredNode ? availableEdges().find((route) => route.to === hoveredNode.id) : null;

  state.hoveredNodeId = edge ? hoveredNode.id : null;
  canvas.style.cursor = edge ? "pointer" : "default";
}

function handleCanvasLeave() {
  state.hoveredNodeId = null;
  canvas.style.cursor = "default";
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function loop(now) {
  const delta = Math.min(50, now - state.lastTick);
  state.lastTick = now;
  update(delta);
  draw();
  syncUi();
  requestAnimationFrame(loop);
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min, max) {
  return Math.round(randomFloat(min, max));
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function randomFee(min, max) {
  return Number(randomFloat(min, max).toFixed(2));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("mousemove", handleCanvasMove);
canvas.addEventListener("mouseleave", handleCanvasLeave);
ui.backToMenu.addEventListener("click", showHome);
ui.homeConnectWallet.addEventListener("click", handleWalletConnectClick);
ui.connectWallet.addEventListener("click", handleWalletConnectClick);
ui.homeBadges.addEventListener("click", openBadgesDialog);
ui.levelBadges.addEventListener("click", openBadgesDialog);
ui.startLevel.addEventListener("click", startSelectedLevel);
ui.closeLevel.addEventListener("click", () => ui.levelDialog.close());
ui.restart.addEventListener("click", resetGame);
ui.playAgain.addEventListener("click", resetGame);
ui.nextStep.addEventListener("click", openMintDialog);
ui.mint.addEventListener("click", openMintDialog);
ui.nicknameInput.addEventListener("input", updateBadgePreview);
ui.confirmMint.addEventListener("click", () => mintAchievementNft());
ui.cancelMint.addEventListener("click", () => ui.mintDialog.close());
ui.nextLevelFromMint.addEventListener("click", goToNextLevel);
ui.refreshBadges.addEventListener("click", refreshBadges);
ui.closeBadges.addEventListener("click", () => ui.badgesDialog.close());

if (window.ethereum) {
  window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
    state.walletAddress = accounts[0] || null;
    updateWalletUi();
  });
  window.ethereum.on?.("accountsChanged", (accounts) => {
    state.walletAddress = accounts[0] || null;
    updateWalletUi();
  });
}

renderLevelGrid();
generateWave();
syncPacketToNode();
syncUi();
requestAnimationFrame(loop);
