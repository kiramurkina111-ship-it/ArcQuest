(function () {
  const ROUND_TIME = 55;
  const TARGET_DELIVERIES = 4;
  const MAX_EXPIRED = 2;
  const FEE_BUDGET = 0.09;

  function createFinalityRush(deps) {
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

    const finality = {
      payments: [],
      lanes: [],
      active: null,
      selectedPaymentId: null,
      expired: 0
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
      finality.expired = 0;
      finality.selectedPaymentId = 1;
      finality.active = null;
      finality.payments = createPayments();
      finality.lanes = createLanes();
      ui.toast.textContent = "Pick an invoice, then choose a lane. Sent is not final until it reaches settlement.";
      ui.lesson.textContent = "Arc finality helps apps know when a payment is truly final, not merely sent, while still balancing speed, fees, and lane capacity.";
    }

    function update(delta) {
      state.timeLeft = Math.max(0, state.timeLeft - delta / 1000);
      if (state.timeLeft <= 0) {
        finishGame(state.delivered >= TARGET_DELIVERIES, "timeout");
        return;
      }

      expirePayments();
      if (state.finished) {
        return;
      }

      if (finality.active) {
        const active = finality.active;
        active.progress = Math.min(1, active.progress + delta / 1000 / active.duration);
        const firstLeg = active.progress < 0.5;
        const legProgress = firstLeg ? active.progress / 0.5 : (active.progress - 0.5) / 0.5;
        const eased = easeInOut(legProgress);
        active.phase = firstLeg ? "sent" : "finalizing";
        active.x = firstLeg ? lerp(active.fromX, active.laneX, eased) : lerp(active.laneX, active.toX, eased);
        active.y = firstLeg ? lerp(active.fromY, active.laneY, eased) : lerp(active.laneY, active.toY, eased);

        if (Math.random() > 0.62) {
          state.particles.push({
            x: active.x,
            y: active.y,
            vx: -8 + Math.random() * 16,
            vy: -8 + Math.random() * 16,
            life: 380,
            color: "#58a6ff"
          });
        }

        if (active.progress >= 1) {
          completeSettlement();
        }
      }

      updateParticles(delta);
    }

    function draw() {
      drawRails();
      drawPayments();
      drawLanes();
      drawSettlement();
      drawParticles();
    }

    function handleClick(event) {
      if (state.finished) return;
      const point = pointerPosition(event);
      const payment = finality.payments.find(
        (item) =>
          item.status === "queued" &&
          point.x >= item.x - 92 &&
          point.x <= item.x + 92 &&
          point.y >= item.y - 34 &&
          point.y <= item.y + 34
      );

      if (payment) {
        finality.selectedPaymentId = payment.id;
        ui.toast.textContent = `${payment.label} selected. Choose a settlement lane.`;
        return;
      }

      const lane = finality.lanes.find(
        (item) =>
          point.x >= item.x - 96 &&
          point.x <= item.x + 96 &&
          point.y >= item.y - 38 &&
          point.y <= item.y + 38
      );

      if (lane) {
        startSettlement(lane);
      }
    }

    function handleMove(event) {
      if (state.finished) {
        canvas.style.cursor = "default";
        return;
      }

      const point = pointerPosition(event);
      const overPayment = finality.payments.some(
        (item) =>
          item.status === "queued" &&
          point.x >= item.x - 92 &&
          point.x <= item.x + 92 &&
          point.y >= item.y - 34 &&
          point.y <= item.y + 34
      );
      const overLane = finality.lanes.some(
        (item) =>
          point.x >= item.x - 96 &&
          point.x <= item.x + 96 &&
          point.y >= item.y - 38 &&
          point.y <= item.y + 38
      );

      canvas.style.cursor = overPayment || overLane ? "pointer" : "default";
    }

    function createPayments() {
      return [
        { id: 1, label: "POS Rush", amount: "$1,250", tag: "4s SLA", deadline: 4.5, status: "queued", x: 145, y: 115 },
        { id: 2, label: "Payroll B", amount: "$640", tag: "tight", deadline: 6.5, status: "queued", x: 145, y: 205 },
        { id: 3, label: "Payout C", amount: "$320", tag: "normal", deadline: 16, status: "queued", x: 145, y: 295 },
        { id: 4, label: "Vendor D", amount: "$980", tag: "normal", deadline: 31, status: "queued", x: 145, y: 385 },
        { id: 5, label: "Agent E", amount: "$75", tag: "cheap OK", deadline: 43, status: "queued", x: 145, y: 475 }
      ];
    }

    function createLanes() {
      return [
        { id: "instant", label: "Instant Finality", fee: 0.04, duration: 1.55, cooldown: 7, availableAt: 0, x: 520, y: 180 },
        { id: "balanced", label: "Balanced Lane", fee: 0.02, duration: 2.7, cooldown: 2, availableAt: 0, x: 520, y: 320 },
        { id: "cheap", label: "Cheap Batch", fee: 0.01, duration: 4.4, cooldown: 0, availableAt: 0, x: 520, y: 460 }
      ];
    }

    function selectedPayment() {
      return finality.payments.find((payment) => payment.id === finality.selectedPaymentId && payment.status === "queued");
    }

    function startSettlement(lane) {
      const payment = selectedPayment();
      if (!payment || finality.active || state.finished) {
        return;
      }

      const elapsed = ROUND_TIME - state.timeLeft;
      const cooldownLeft = Math.max(0, lane.availableAt - elapsed);
      if (cooldownLeft > 0) {
        ui.toast.textContent = `${lane.label} is refilling capacity. Available in ${Math.ceil(cooldownLeft)}s.`;
        return;
      }

      if (state.totalFees + lane.fee > FEE_BUDGET) {
        ui.toast.textContent = `${lane.label} would break the $${FEE_BUDGET.toFixed(2)} fee budget. Pick a cheaper lane.`;
        return;
      }

      payment.status = "settling";
      lane.availableAt = elapsed + lane.duration + lane.cooldown;
      finality.active = {
        paymentId: payment.id,
        laneId: lane.id,
        progress: 0,
        duration: lane.duration,
        fee: lane.fee,
        x: payment.x,
        y: payment.y,
        fromX: payment.x,
        fromY: payment.y,
        laneX: lane.x,
        laneY: lane.y,
        toX: 800,
        toY: 320,
        phase: "sent"
      };
      state.totalFees += lane.fee;
      ui.toast.textContent = `${payment.label} sent to ${lane.label}. It still must finalize. Budget left: $${Math.max(0, FEE_BUDGET - state.totalFees).toFixed(2)}.`;
    }

    function completeSettlement() {
      const active = finality.active;
      const payment = finality.payments.find((item) => item.id === active.paymentId);
      const lane = finality.lanes.find((item) => item.id === active.laneId);
      payment.status = "settled";
      state.delivered += 1;
      state.score += scorePayment(payment, lane);
      burst(active.toX, active.toY, "#58a6ff", 16);
      finality.active = null;
      finality.selectedPaymentId = finality.payments.find((item) => item.status === "queued")?.id || null;
      ui.toast.textContent = `${payment.label} finalized. Deterministic settlement removes the waiting game.`;

      if (state.delivered >= TARGET_DELIVERIES) {
        finishGame(true);
      }
    }

    function scorePayment(payment, lane) {
      const elapsed = ROUND_TIME - state.timeLeft;
      const urgencyBonus = Math.max(0, payment.deadline - elapsed);
      const speedReward = lane.id === "instant" ? 84 : lane.id === "balanced" ? 72 : 60;
      const feePenalty = lane.fee * 350;
      const budgetReward = Math.max(0, FEE_BUDGET - state.totalFees) * 180;
      return Math.max(8, Math.round(speedReward + urgencyBonus + budgetReward - feePenalty));
    }

    function expirePayments() {
      const elapsed = ROUND_TIME - state.timeLeft;
      for (const payment of finality.payments) {
        if ((payment.status === "queued" || payment.status === "settling") && elapsed >= payment.deadline) {
          payment.status = "expired";
          finality.expired += 1;

          if (finality.active?.paymentId === payment.id) {
            finality.active = null;
          }

          if (finality.selectedPaymentId === payment.id) {
            finality.selectedPaymentId = finality.payments.find((item) => item.status === "queued")?.id || null;
          }

          ui.toast.textContent = `${payment.label} expired before settlement. Arc finality matters when deadlines are real.`;
        }
      }

      if (finality.expired >= MAX_EXPIRED) {
        finishGame(false, "expired");
      }
    }

    function drawRails() {
      ctx.fillStyle = "rgba(88, 166, 255, 0.045)";
      for (const lane of finality.lanes) {
        roundRect(ctx, 300, lane.y - 48, 440, 96, 10);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(88, 166, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(285, 90);
      ctx.lineTo(285, 510);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(745, 90);
      ctx.lineTo(745, 510);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      roundRect(ctx, 765, 255, 120, 130, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(88, 166, 255, 0.28)";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("FINAL", 825, 305);
      ctx.fillText("SETTLED", 825, 335);

      ctx.fillStyle = "rgba(201, 209, 217, 0.78)";
      ctx.font = "800 11px Inter, sans-serif";
      ctx.fillText("Sent ≠ Final", 825, 362);
    }

    function drawPayments() {
      const elapsed = ROUND_TIME - state.timeLeft;
      for (const payment of finality.payments) {
        const selected = finality.selectedPaymentId === payment.id;
        const remaining = Math.max(0, payment.deadline - elapsed);
        const expired = payment.status === "expired";
        const settled = payment.status === "settled";

        ctx.fillStyle = selected ? "rgba(88, 166, 255, 0.2)" : settled ? "rgba(88, 166, 255, 0.1)" : "rgba(1, 4, 9, 0.48)";
        roundRect(ctx, payment.x - 92, payment.y - 34, 184, 68, 8);
        ctx.fill();
        ctx.strokeStyle = expired ? "rgba(248, 81, 73, 0.72)" : selected ? "rgba(88, 166, 255, 0.82)" : "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.stroke();

        ctx.fillStyle = expired ? "#ffb3b0" : settled ? "#cfe1ff" : "#ffffff";
        ctx.font = "900 14px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(payment.label, payment.x - 76, payment.y - 11);
        ctx.fillStyle = "#9aa7b4";
        ctx.font = "800 12px Inter, sans-serif";
        ctx.fillText(`${payment.amount} / ${settled ? "settled" : expired ? "expired" : `${Math.ceil(remaining)}s`} / ${payment.tag}`, payment.x - 76, payment.y + 14);
      }
    }

    function drawLanes() {
      const elapsed = ROUND_TIME - state.timeLeft;
      for (const lane of finality.lanes) {
        const cooldownLeft = Math.max(0, lane.availableAt - elapsed);
        const overBudget = state.totalFees + lane.fee > FEE_BUDGET;
        const disabled = cooldownLeft > 0 || overBudget || Boolean(finality.active);
        ctx.fillStyle = disabled ? "rgba(14, 19, 31, 0.58)" : "rgba(14, 19, 31, 0.92)";
        roundRect(ctx, lane.x - 96, lane.y - 38, 192, 76, 8);
        ctx.fill();
        ctx.strokeStyle = overBudget ? "rgba(248, 81, 73, 0.62)" : cooldownLeft > 0 ? "rgba(255, 255, 255, 0.18)" : "rgba(88, 166, 255, 0.36)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = disabled ? "#9aa7b4" : "#ffffff";
        ctx.font = "900 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(lane.label, lane.x, lane.y - 9);
        ctx.fillStyle = overBudget ? "#ffb3b0" : "#9aa7b4";
        ctx.font = "800 12px Inter, sans-serif";
        const status = cooldownLeft > 0 ? `cooldown ${Math.ceil(cooldownLeft)}s` : overBudget ? "over budget" : `${lane.duration.toFixed(1)}s`;
        ctx.fillText(`fee $${lane.fee.toFixed(2)} / ${status}`, lane.x, lane.y + 16);
      }
    }

    function drawSettlement() {
      if (!finality.active) {
        return;
      }

      ctx.fillStyle = "#2775ca";
      ctx.shadowColor = "rgba(88, 166, 255, 0.9)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(finality.active.x, finality.active.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      drawUsdcMark(finality.active.x, finality.active.y, 15);

      ctx.fillStyle = "rgba(1, 4, 9, 0.86)";
      roundRect(ctx, finality.active.x - 44, finality.active.y - 42, 88, 24, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(88, 166, 255, 0.36)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#cfe1ff";
      ctx.font = "800 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(finality.active.phase === "sent" ? "SENT" : "FINALIZING", finality.active.x, finality.active.y - 30);
      ctx.textBaseline = "alphabetic";
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
    createFinalityRush
  };
})();
