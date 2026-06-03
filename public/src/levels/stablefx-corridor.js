(function () {
  const ROUND_TIME = 72;
  const TARGET_DELIVERIES = 4;
  const MAX_FAILED = 2;
  const FEE_BUDGET = 0.16;
  const ALLOCATION_STEP = 25;

  function createStableFxCorridor(deps) {
    const {
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
    } = deps;

    const fx = {
      orders: [],
      corridors: [],
      allocation: {},
      orderIndex: 0,
      orderRemaining: 0,
      failed: 0,
      totalSlippage: 0,
      active: null
    };

    const layout = {
      order: { x: 40, y: 76, w: 274, h: 170 },
      quote: { x: 40, y: 278, w: 274, h: 210 },
      clear: { x: 62, y: 438, w: 94, h: 36 },
      settle: { x: 170, y: 438, w: 122, h: 36 },
      recipient: { x: 874, y: 260 },
      corridors: [
        { x: 352, y: 76, w: 250, h: 155 },
        { x: 632, y: 76, w: 250, h: 155 },
        { x: 352, y: 290, w: 250, h: 155 },
        { x: 632, y: 290, w: 250, h: 155 }
      ]
    };

    function reset() {
      state.current = null;
      state.target = null;
      state.progress = 0;
      state.delivered = 0;
      state.score = 0;
      state.totalFees = 0;
      state.timeLeft = ROUND_TIME;
      state.route = null;
      state.hoveredNodeId = null;
      state.particles = [];
      fx.failed = 0;
      fx.totalSlippage = 0;
      fx.orderIndex = 0;
      fx.active = null;
      fx.allocation = {};
      fx.orders = createOrders();
      fx.corridors = createCorridors();
      fx.orderRemaining = currentOrder()?.ttl || 0;
      ui.toast.textContent = "Build a 100% FX split. Click corridors to add 25%, then settle the quote.";
      ui.lesson.textContent = "Stablecoin FX is a quote-building problem: the app must balance currency outcome, dollar fees, liquidity depth, slippage tolerance, and settlement speed.";
    }

    function update(delta) {
      state.timeLeft = Math.max(0, state.timeLeft - delta / 1000);
      recoverLiquidity(delta);
      updateMarketDrift(delta);

      if (state.timeLeft <= 0) {
        finishGame(state.delivered >= TARGET_DELIVERIES, "timeout");
        return;
      }

      const order = currentOrder();
      if (!order || state.finished) {
        return;
      }

      fx.orderRemaining = Math.max(0, fx.orderRemaining - delta / 1000);

      if (fx.active) {
        updateActiveQuote(delta);
        updateParticles(delta);
        return;
      }

      if (fx.orderRemaining <= 0) {
        failCurrentOrder("expired");
      }

      updateParticles(delta);
    }

    function draw() {
      drawHeaderLabels();
      drawCurrentOrder();
      drawQuoteBuilder();
      drawCorridors();
      drawRecipient();
      drawActiveQuote();
      drawParticles();
    }

    function handleClick(event) {
      if (state.finished || fx.active || !currentOrder()) return;
      const point = pointerPosition(event);

      if (inside(point, layout.clear)) {
        fx.allocation = {};
        ui.toast.textContent = "Quote cleared. Build a new split.";
        return;
      }

      if (inside(point, layout.settle)) {
        settleQuote();
        return;
      }

      const corridor = corridorAt(point);
      if (corridor) {
        addAllocation(corridor.id);
      }
    }

    function handleMove(event) {
      if (state.finished || fx.active) {
        canvas.style.cursor = "default";
        return;
      }

      const point = pointerPosition(event);
      canvas.style.cursor = inside(point, layout.clear) || inside(point, layout.settle) || corridorAt(point)
        ? "pointer"
        : "default";
    }

    function createOrders() {
      return [
        { id: 1, label: "SaaS renewal", pair: "USDC -> EURC", amount: "$480", size: 18, ttl: 15, maxSlippage: 0.72 },
        { id: 2, label: "CAD payroll", pair: "USDC -> CAD", amount: "$820", size: 36, ttl: 17, maxSlippage: 0.52 },
        { id: 3, label: "Creator payout", pair: "USDC -> CAD", amount: "$120", size: 8, ttl: 14, maxSlippage: 1.34 },
        { id: 4, label: "Vendor invoice", pair: "USDC -> EURC", amount: "$260", size: 14, ttl: 16, maxSlippage: 1.04 },
        { id: 5, label: "Treasury rebalance", pair: "USDC -> EURC", amount: "$1,100", size: 48, ttl: 19, maxSlippage: 0.64 }
      ];
    }

    function createCorridors() {
      return [
        { id: "arc", label: "Arc Quote", note: "balanced", fee: 0.028, duration: 2.1, baseSlippage: 0.24, liquidity: 94, maxLiquidity: 94, recovery: 5.2, drift: 0.02, driftDir: 1 },
        { id: "deep", label: "Deep Pool", note: "lowest slip", fee: 0.044, duration: 3.2, baseSlippage: 0.12, liquidity: 132, maxLiquidity: 132, recovery: 4.2, drift: 0.01, driftDir: -1 },
        { id: "maker", label: "Fast Maker", note: "fast, costly", fee: 0.058, duration: 1.35, baseSlippage: 0.52, liquidity: 76, maxLiquidity: 76, recovery: 3.4, drift: 0.05, driftDir: 1 },
        { id: "thin", label: "Thin Market", note: "cheap, shallow", fee: 0.014, duration: 2.65, baseSlippage: 0.82, liquidity: 48, maxLiquidity: 48, recovery: 6.6, drift: 0.08, driftDir: -1 }
      ];
    }

    function currentOrder() {
      return fx.orders[fx.orderIndex] || null;
    }

    function addAllocation(corridorId) {
      const total = totalAllocation();
      if (total >= 100) {
        ui.toast.textContent = "The quote is already 100%. Clear it or settle.";
        return;
      }

      fx.allocation[corridorId] = (fx.allocation[corridorId] || 0) + ALLOCATION_STEP;
      const quote = buildQuote();
      ui.toast.textContent = `${corridorLabel(corridorId)} +25%. Total ${quote.total}%. Quoted slippage: ${quote.ready ? `${quote.slippage.toFixed(2)}%` : "incomplete"}.`;
    }

    function settleQuote() {
      const order = currentOrder();
      const quote = buildQuote();
      if (!order || !quote.ready) {
        ui.toast.textContent = "Build the split to exactly 100% before settling.";
        return;
      }

      if (state.totalFees + quote.fee > FEE_BUDGET) {
        ui.toast.textContent = `This quote breaks the $${FEE_BUDGET.toFixed(2)} fee budget. Clear and use cheaper corridors.`;
        return;
      }

      const late = quote.eta > fx.orderRemaining;
      fx.active = {
        order,
        quote,
        late,
        progress: 0,
        duration: Math.max(1.2, quote.eta),
        packets: quote.parts.map((part, index) => {
          const corridor = fx.corridors.find((item) => item.id === part.id);
          const box = corridorBox(corridor);
          return {
            id: part.id,
            delay: index * 0.08,
            fromX: layout.order.x + layout.order.w - 28,
            fromY: layout.order.y + 82,
            midX: box.x + box.w / 2,
            midY: box.y + box.h / 2,
            toX: layout.recipient.x,
            toY: layout.recipient.y
          };
        })
      };

      depleteLiquidity(order, quote);
      ui.toast.textContent = late
        ? "Quote sent, but ETA is beyond the payment deadline."
        : `Quote sent: ${quote.parts.length} corridor${quote.parts.length === 1 ? "" : "s"}, ${quote.slippage.toFixed(2)}% slippage.`;
    }

    function updateActiveQuote(delta) {
      fx.active.progress = Math.min(1, fx.active.progress + delta / 1000 / fx.active.duration);
      for (const packet of fx.active.packets) {
        const progress = Math.max(0, Math.min(1, (fx.active.progress - packet.delay) / (1 - packet.delay)));
        const point = packetPosition(packet, progress);
        if (Math.random() > 0.62) {
          state.particles.push({
            x: point.x,
            y: point.y,
            vx: -9 + Math.random() * 18,
            vy: -9 + Math.random() * 18,
            life: 380,
            color: fx.active.quote.slippage > fx.active.order.maxSlippage || fx.active.late ? "#f85149" : "#58a6ff"
          });
        }
      }

      if (fx.active.progress >= 1) {
        completeQuote();
      }
    }

    function completeQuote() {
      const active = fx.active;
      fx.active = null;
      state.totalFees += active.quote.fee;

      if (active.late) {
        failCurrentOrder("late");
        return;
      }

      if (active.quote.slippage > active.order.maxSlippage) {
        failCurrentOrder("slippage");
        return;
      }

      state.delivered += 1;
      fx.totalSlippage += active.quote.slippage;
      state.score += scoreQuote(active.order, active.quote);
      burst(layout.recipient.x, layout.recipient.y, "#58a6ff", 18);
      ui.lesson.textContent = "Splitting FX flow can reduce slippage, but every split has a fee and speed tradeoff. The useful product is a quote the business can trust.";
      ui.toast.textContent = `${active.order.label} settled inside tolerance. Recipient currency delivered.`;
      advanceOrder();

      if (state.delivered >= TARGET_DELIVERIES) {
        finishGame(true);
      }
    }

    function failCurrentOrder(reason) {
      const order = currentOrder();
      if (!order || state.finished) return;
      fx.failed += 1;
      burst(layout.recipient.x, layout.recipient.y, "#f85149", 18);
      ui.toast.textContent = reason === "expired"
        ? `${order.label} expired before you locked a quote.`
        : reason === "late"
          ? `${order.label} arrived too late. Fast FX can matter as much as cheap FX.`
          : `${order.label} failed: slippage exceeded ${order.maxSlippage.toFixed(2)}% tolerance.`;
      advanceOrder();

      if (fx.failed >= MAX_FAILED) {
        finishGame(false, reason === "late" ? "expired" : reason);
      }
    }

    function advanceOrder() {
      fx.orderIndex += 1;
      fx.allocation = {};
      fx.orderRemaining = currentOrder()?.ttl || 0;

      if (!currentOrder() && state.delivered < TARGET_DELIVERIES && !state.finished) {
        finishGame(false, "expired");
      }
    }

    function scoreQuote(order, quote) {
      const slippageHeadroom = Math.max(0, order.maxSlippage - quote.slippage);
      const slippageReward = 52 + slippageHeadroom * 34;
      const feeReward = Math.max(0, 24 - quote.fee * 150);
      const timeReward = Math.max(0, fx.orderRemaining * 1.3);
      const splitReward = quote.parts.length > 1 ? 8 : 0;
      return Math.max(10, Math.round(slippageReward + feeReward + timeReward + splitReward));
    }

    function recoverLiquidity(delta) {
      for (const corridor of fx.corridors) {
        corridor.liquidity = Math.min(corridor.maxLiquidity, corridor.liquidity + (corridor.recovery * delta) / 1000);
      }
    }

    function updateMarketDrift(delta) {
      for (const corridor of fx.corridors) {
        corridor.drift += corridor.driftDir * delta * 0.000018;
        if (corridor.drift > 0.14 || corridor.drift < -0.02) {
          corridor.driftDir *= -1;
          corridor.drift = Math.max(-0.02, Math.min(0.14, corridor.drift));
        }
      }
    }

    function depleteLiquidity(order, quote) {
      for (const part of quote.parts) {
        const corridor = fx.corridors.find((item) => item.id === part.id);
        corridor.liquidity = Math.max(8, corridor.liquidity - order.size * (part.percent / 100) * 0.82);
      }
    }

    function buildQuote() {
      const order = currentOrder();
      const parts = Object.entries(fx.allocation)
        .map(([id, percent]) => ({ id, percent }))
        .filter((part) => part.percent > 0);
      const total = parts.reduce((sum, part) => sum + part.percent, 0);

      if (!order || total !== 100) {
        return { ready: false, total, parts, fee: 0, slippage: 0, eta: 0 };
      }

      let fee = 0;
      let slippage = 0;
      let eta = 0;
      for (const part of parts) {
        const corridor = fx.corridors.find((item) => item.id === part.id);
        const percent = part.percent / 100;
        const amountPressure = (order.size * percent) / Math.max(10, corridor.liquidity);
        const pairPenalty = order.pair.includes("CAD") && corridor.id === "thin" ? 0.12 : 0;
        const sizePenalty = order.size > 34 && corridor.id === "maker" ? 0.15 : 0;
        const partSlippage = corridor.baseSlippage + corridor.drift + amountPressure * 0.74 + pairPenalty + sizePenalty;
        fee += corridor.fee * percent;
        slippage += partSlippage * percent;
        eta = Math.max(eta, corridor.duration);
      }

      eta += Math.max(0, parts.length - 1) * 0.28;
      return { ready: true, total, parts, fee, slippage, eta };
    }

    function totalAllocation() {
      return Object.values(fx.allocation).reduce((sum, value) => sum + value, 0);
    }

    function corridorLabel(id) {
      return fx.corridors.find((corridor) => corridor.id === id)?.label || "Corridor";
    }

    function corridorBox(corridor) {
      const index = fx.corridors.findIndex((item) => item.id === corridor.id);
      return layout.corridors[index];
    }

    function corridorAt(point) {
      return fx.corridors.find((corridor) => inside(point, corridorBox(corridor)));
    }

    function inside(point, box) {
      return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
    }

    function packetPosition(packet, progress) {
      const firstLeg = progress < 0.48;
      const amount = firstLeg ? progress / 0.48 : (progress - 0.48) / 0.52;
      const eased = easeInOut(amount);
      return {
        x: firstLeg ? lerp(packet.fromX, packet.midX, eased) : lerp(packet.midX, packet.toX, eased),
        y: firstLeg ? lerp(packet.fromY, packet.midY, eased) : lerp(packet.midY, packet.toY, eased)
      };
    }

    function drawHeaderLabels() {
      drawColumnLabel("Current FX request", 40, 52);
      drawColumnLabel("Quote builder", 40, 268);
      drawColumnLabel("Click corridors to allocate 25%", 352, 52);
    }

    function drawColumnLabel(label, x, y) {
      ctx.fillStyle = "#8bb2ff";
      ctx.font = "900 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(label.toUpperCase(), x, y);
    }

    function drawCurrentOrder() {
      const order = currentOrder();
      drawCard(layout.order, "rgba(1, 4, 9, 0.58)", "rgba(88, 166, 255, 0.28)");
      if (!order) {
        drawText("No more requests", layout.order.x + 22, layout.order.y + 44, "#ffffff", "900 18px Inter, sans-serif");
        return;
      }

      const danger = fx.orderRemaining <= 5;
      drawText(order.label, layout.order.x + 22, layout.order.y + 36, "#ffffff", "900 19px Inter, sans-serif");
      drawText(order.pair, layout.order.x + 22, layout.order.y + 65, "#cfe1ff", "900 14px Inter, sans-serif");
      drawText(`${order.amount} / tolerance ${order.maxSlippage.toFixed(2)}%`, layout.order.x + 22, layout.order.y + 93, "#c9d1d9", "800 13px Inter, sans-serif");
      drawText(`quote window ${Math.ceil(fx.orderRemaining)}s`, layout.order.x + 22, layout.order.y + 122, danger ? "#ffb3b0" : "#8bb2ff", "900 14px Inter, sans-serif");
      drawProgressBar(layout.order.x + 22, layout.order.y + 138, layout.order.w - 44, 8, fx.orderRemaining / order.ttl, danger ? "#f85149" : "#58a6ff");
    }

    function drawQuoteBuilder() {
      const quote = buildQuote();
      const order = currentOrder();
      const overTolerance = quote.ready && order && quote.slippage > order.maxSlippage;
      const overBudget = quote.ready && state.totalFees + quote.fee > FEE_BUDGET;
      const late = quote.ready && quote.eta > fx.orderRemaining;

      drawCard(layout.quote, "rgba(1, 4, 9, 0.58)", overTolerance || overBudget || late ? "rgba(248, 81, 73, 0.42)" : "rgba(88, 166, 255, 0.28)");
      drawText(`Allocated ${quote.total}/100%`, layout.quote.x + 22, layout.quote.y + 34, "#ffffff", "900 17px Inter, sans-serif");
      drawProgressBar(layout.quote.x + 22, layout.quote.y + 48, layout.quote.w - 44, 9, quote.total / 100, quote.total === 100 ? "#58a6ff" : "#8bb2ff");

      const slippageCopy = quote.ready ? `${quote.slippage.toFixed(2)}%` : "--";
      const feeCopy = quote.ready ? `$${quote.fee.toFixed(3)}` : "--";
      const etaCopy = quote.ready ? `${quote.eta.toFixed(1)}s` : "--";
      drawText(`Slippage: ${slippageCopy}`, layout.quote.x + 22, layout.quote.y + 86, overTolerance ? "#ffb3b0" : "#c9d1d9", "800 13px Inter, sans-serif");
      drawText(`Fee: ${feeCopy}`, layout.quote.x + 22, layout.quote.y + 112, overBudget ? "#ffb3b0" : "#c9d1d9", "800 13px Inter, sans-serif");
      drawText(`ETA: ${etaCopy}`, layout.quote.x + 22, layout.quote.y + 138, late ? "#ffb3b0" : "#c9d1d9", "800 13px Inter, sans-serif");

      drawButton(layout.clear, "Clear", false);
      drawButton(layout.settle, "Settle Quote", !quote.ready || overBudget);
    }

    function drawCorridors() {
      const quote = buildQuote();
      for (const corridor of fx.corridors) {
        const box = corridorBox(corridor);
        const allocated = fx.allocation[corridor.id] || 0;
        const part = quote.parts.find((item) => item.id === corridor.id);
        const selected = allocated > 0;
        const canAdd = totalAllocation() < 100 && !fx.active;
        drawCard(box, selected ? "rgba(88, 166, 255, 0.16)" : "rgba(14, 19, 31, 0.82)", selected ? "rgba(88, 166, 255, 0.74)" : "rgba(255, 255, 255, 0.13)");

        drawText(corridor.label, box.x + 18, box.y + 32, "#ffffff", "900 16px Inter, sans-serif");
        drawText(corridor.note, box.x + 18, box.y + 56, "#8bb2ff", "900 12px Inter, sans-serif");
        drawText(`alloc ${allocated}%`, box.x + box.w - 86, box.y + 32, allocated ? "#cfe1ff" : "#9aa7b4", "900 13px Inter, sans-serif");
        drawText(`fee $${corridor.fee.toFixed(3)} / ${corridor.duration.toFixed(1)}s`, box.x + 18, box.y + 88, "#c9d1d9", "800 12px Inter, sans-serif");
        drawText(`base slip ${(corridor.baseSlippage + corridor.drift).toFixed(2)}%`, box.x + 18, box.y + 110, "#c9d1d9", "800 12px Inter, sans-serif");
        if (part) {
          drawText(`this split ${part.percent}%`, box.x + box.w - 104, box.y + 110, "#cfe1ff", "900 12px Inter, sans-serif");
        }
        drawProgressBar(box.x + 18, box.y + 128, box.w - 36, 8, corridor.liquidity / corridor.maxLiquidity, corridor.liquidity < corridor.maxLiquidity * 0.35 ? "#f85149" : "#58a6ff");

        if (canAdd) {
          drawText("+25%", box.x + box.w - 50, box.y + box.h - 18, "#ffffff", "900 12px Inter, sans-serif");
        }
      }
    }

    function drawRecipient() {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.arc(layout.recipient.x, layout.recipient.y, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(88, 166, 255, 0.34)";
      ctx.lineWidth = 2;
      ctx.stroke();

      drawText("FX", layout.recipient.x, layout.recipient.y - 8, "#ffffff", "900 18px Inter, sans-serif", "center");
      drawText("SETTLED", layout.recipient.x, layout.recipient.y + 18, "#cfe1ff", "900 12px Inter, sans-serif", "center");
      drawInfoPill(`Failed ${fx.failed}/${MAX_FAILED}`, 774, 504, fx.failed > 0 ? "#ffb3b0" : "#cfe1ff");
      drawInfoPill(`Avg slip ${averageSlippage()}`, 774, 536, "#cfe1ff");
    }

    function drawActiveQuote() {
      if (!fx.active) return;

      for (const packet of fx.active.packets) {
        const progress = Math.max(0, Math.min(1, (fx.active.progress - packet.delay) / (1 - packet.delay)));
        if (progress <= 0) continue;
        const point = packetPosition(packet, progress);
        ctx.fillStyle = "#2775ca";
        ctx.shadowColor = "rgba(88, 166, 255, 0.9)";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        drawUsdcMark(point.x, point.y, 14);
      }

      const lead = fx.active.packets[0];
      const point = packetPosition(lead, Math.min(1, fx.active.progress));
      const bad = fx.active.quote.slippage > fx.active.order.maxSlippage || fx.active.late;
      ctx.fillStyle = "rgba(1, 4, 9, 0.86)";
      roundRect(ctx, point.x - 48, point.y - 42, 96, 24, 6);
      ctx.fill();
      ctx.strokeStyle = bad ? "rgba(248, 81, 73, 0.52)" : "rgba(88, 166, 255, 0.36)";
      ctx.stroke();
      drawText(bad ? "RISKY FX" : "FX QUOTE", point.x, point.y - 27, bad ? "#ffb3b0" : "#cfe1ff", "800 11px Inter, sans-serif", "center");
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

    function drawCard(box, fill, stroke) {
      ctx.fillStyle = fill;
      roundRect(ctx, box.x, box.y, box.w, box.h, 10);
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    function drawButton(box, label, disabled) {
      ctx.fillStyle = disabled ? "rgba(48, 54, 61, 0.78)" : "rgba(0, 29, 119, 0.95)";
      roundRect(ctx, box.x, box.y, box.w, box.h, 8);
      ctx.fill();
      ctx.strokeStyle = disabled ? "rgba(255, 255, 255, 0.12)" : "rgba(88, 166, 255, 0.42)";
      ctx.stroke();
      drawText(label, box.x + box.w / 2, box.y + 23, disabled ? "#8b949e" : "#ffffff", "900 13px Inter, sans-serif", "center");
    }

    function drawProgressBar(x, y, width, height, value, color) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      roundRect(ctx, x, y, width, height, height / 2);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, x, y, Math.max(height, width * Math.max(0, Math.min(1, value))), height, height / 2);
      ctx.fill();
    }

    function drawInfoPill(label, x, y, color) {
      ctx.fillStyle = "rgba(1, 4, 9, 0.72)";
      roundRect(ctx, x, y - 24, 150, 28, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(88, 166, 255, 0.24)";
      ctx.stroke();
      drawText(label, x + 12, y - 5, color, "800 12px Inter, sans-serif");
    }

    function drawText(text, x, y, color, font, align = "left") {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, x, y);
    }

    function averageSlippage() {
      if (state.delivered === 0) return "0.00%";
      return `${(fx.totalSlippage / state.delivered).toFixed(2)}%`;
    }

    return {
      targetDeliveries: TARGET_DELIVERIES,
      feeBudget: FEE_BUDGET,
      reset,
      update,
      draw,
      handleClick,
      handleMove
    };
  }

  window.ArcQuestLevels = {
    ...(window.ArcQuestLevels || {}),
    createStableFxCorridor
  };
})();
