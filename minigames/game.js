// ============================================================
//  MINI CASINO — Main Game Script
// ============================================================

(() => {
    // ---- State ----
    let coins = parseInt(localStorage.getItem('casino_coins') || '0', 10);
    let bet = 10;
    const BET_STEPS = [5, 10, 25, 50, 100, 250, 500];
    let betIndex = 1;
    const activeBalls = [];
    let animationRunning = false;

    // ---- DOM refs ----
    const coinCountEl = document.getElementById('coin-count');
    const clickBtn = document.getElementById('click-btn');
    const particleContainer = document.getElementById('click-particles');
    const menuScreen = document.getElementById('menu-screen');
    const plinkoScreen = document.getElementById('plinko-screen');
    const backBtn = document.getElementById('back-btn');
    const betAmountEl = document.getElementById('bet-amount');
    const betUpBtn = document.getElementById('bet-up');
    const betDownBtn = document.getElementById('bet-down');
    const dropBtn = document.getElementById('drop-btn');
    const canvas = document.getElementById('plinko-canvas');
    const ctx = canvas.getContext('2d');
    const resultPopup = document.getElementById('plinko-result');

    // ---- Helpers ----
    function saveCoins() {
        localStorage.setItem('casino_coins', coins.toString());
    }

    function updateCoinDisplay() {
        coinCountEl.textContent = coins.toLocaleString();
        coinCountEl.classList.add('bump');
        setTimeout(() => coinCountEl.classList.remove('bump'), 100);
    }

    function addCoins(amount) {
        coins += amount;
        saveCoins();
        updateCoinDisplay();
    }

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    // ---- Coin Clicker ----
    clickBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        earnClick(e);
    });
    clickBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        earnClick(e.touches[0]);
    });

    function earnClick(e) {
        const earned = 1;
        addCoins(earned);

        // Spawn floating +1
        const rect = clickBtn.getBoundingClientRect();
        const containerRect = particleContainer.getBoundingClientRect();
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        particle.textContent = `+${earned}`;
        const offsetX = (e.clientX || rect.left + rect.width / 2) - containerRect.left;
        const offsetY = (e.clientY || rect.top + rect.height / 2) - containerRect.top;
        particle.style.left = `${offsetX + (Math.random() - 0.5) * 40}px`;
        particle.style.top = `${offsetY - 10}px`;
        particleContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }

    // ---- Navigation ----
    document.querySelectorAll('.game-card[data-game]').forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            if (game === 'plinko') {
                showScreen(plinkoScreen);
                resizePlinkoCanvas();
            }
        });
    });

    backBtn.addEventListener('click', () => showScreen(menuScreen));

    // ---- Bet Controls ----
    function updateBet() {
        bet = BET_STEPS[betIndex];
        betAmountEl.textContent = bet;
    }

    betUpBtn.addEventListener('click', () => {
        if (betIndex < BET_STEPS.length - 1) betIndex++;
        updateBet();
    });

    betDownBtn.addEventListener('click', () => {
        if (betIndex > 0) betIndex--;
        updateBet();
    });

    // ============================================================
    //  PLINKO GAME
    // ============================================================

    const ROWS = 12;
    const BUCKET_COUNT = ROWS + 1; // 13 buckets

    // Multipliers — center is low, edges are high (13 buckets, symmetric)
    const BUCKET_MULTIPLIERS = [
        110, 41, 10, 5, 3, 1.5, 0.5, 1.5, 3, 5, 10, 41, 110
    ];

    // Colors for multipliers
    function multColor(mult) {
        if (mult >= 41) return '#ff2d55';
        if (mult >= 10) return '#ff6b35';
        if (mult >= 5) return '#ffaa00';
        if (mult >= 3) return '#e2b340';
        if (mult >= 1.5) return '#8bc34a';
        if (mult >= 1) return '#4caf50';
        return '#607d8b';
    }

    // Canvas sizing
    let W, H, pegRadius, ballRadius, pegSpacingX, pegSpacingY, startY, boardLeft, boardRight;

    function resizePlinkoCanvas() {
        const container = canvas.parentElement;
        const maxW = Math.min(container.clientWidth - 48, 700);
        const aspect = 1.15;
        W = maxW;
        H = maxW * aspect;
        canvas.width = W * devicePixelRatio;
        canvas.height = H * devicePixelRatio;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

        pegSpacingX = W / (ROWS + 2);
        pegSpacingY = (H - 120) / (ROWS + 1);
        startY = 40;
        pegRadius = Math.max(4, W / 120);
        ballRadius = pegRadius * 2.2;
        boardLeft = pegSpacingX;
        boardRight = W - pegSpacingX;

        drawBoard();
    }

    function getPegPosition(row, col) {
        const pegsInRow = row + 2;
        const totalWidth = (pegsInRow - 1) * pegSpacingX;
        const offsetX = (W - totalWidth) / 2;
        return {
            x: offsetX + col * pegSpacingX,
            y: startY + (row + 1) * pegSpacingY
        };
    }

    function getBucketX(bucketIndex) {
        const totalWidth = (BUCKET_COUNT - 1) * pegSpacingX;
        const offsetX = (W - totalWidth) / 2;
        return offsetX + bucketIndex * pegSpacingX;
    }

    function drawBoard(balls) {
        ctx.clearRect(0, 0, W, H);

        // Draw pegs
        for (let row = 0; row < ROWS; row++) {
            const pegsInRow = row + 2;
            for (let col = 0; col < pegsInRow; col++) {
                const { x, y } = getPegPosition(row, col);
                ctx.beginPath();
                ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#3a3a6e';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, y, pegRadius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#5a5a9e';
                ctx.fill();
            }
        }

        // Draw buckets
        const bucketY = startY + (ROWS + 1) * pegSpacingY;
        const lastRowPegs = ROWS + 1; // pegs in last row = ROWS + 2 - 1... wait
        // Actually row index ROWS-1 has ROWS+1 pegs. Buckets sit between/outside them.
        // Buckets count = ROWS + 1 = 13
        const bucketWidth = pegSpacingX * 0.9;
        const bucketHeight = 40;

        for (let i = 0; i < BUCKET_COUNT; i++) {
            const bx = getBucketX(i);
            const mult = BUCKET_MULTIPLIERS[i];
            const col = multColor(mult);

            // Bucket background
            ctx.fillStyle = col + '22';
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(bx - bucketWidth / 2, bucketY, bucketWidth, bucketHeight, 6);
            ctx.fill();
            ctx.stroke();

            // Multiplier text
            ctx.fillStyle = col;
            ctx.font = `bold ${Math.max(10, W / 55)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = mult >= 1 ? `${mult}x` : `${mult}x`;
            ctx.fillText(label, bx, bucketY + bucketHeight / 2);
        }

        // Draw divider lines between buckets
        for (let i = 0; i <= BUCKET_COUNT; i++) {
            const bkTotalWidth = (BUCKET_COUNT - 1) * pegSpacingX;
            const bkOffsetX = (W - bkTotalWidth) / 2;
            const dx = bkOffsetX + (i - 0.5) * pegSpacingX;
            ctx.beginPath();
            ctx.moveTo(dx, bucketY);
            ctx.lineTo(dx, bucketY + bucketHeight);
            ctx.strokeStyle = '#2a2a4e';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw balls
        if (balls) {
            for (const ball of balls) {
                // Glow
                const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ballRadius * 2);
                gradient.addColorStop(0, 'rgba(226, 179, 64, 0.4)');
                gradient.addColorStop(1, 'rgba(226, 179, 64, 0)');
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ballRadius * 2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Ball
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
                const ballGrad = ctx.createRadialGradient(
                    ball.x - ballRadius * 0.3, ball.y - ballRadius * 0.3, ballRadius * 0.1,
                    ball.x, ball.y, ballRadius
                );
                ballGrad.addColorStop(0, '#ffe082');
                ballGrad.addColorStop(0.7, '#e2b340');
                ballGrad.addColorStop(1, '#b8860b');
                ctx.fillStyle = ballGrad;
                ctx.fill();
            }
        }
    }

    // ---- Ball Physics (simulated step-by-step through peg rows) ----
    function simulateBallPath() {
        // The ball starts at center top
        // At each row, it hits a peg and goes left or right
        // Probability: 50/50 at each peg
        // Position tracked as an index that shifts left (0) or right (+1)
        // After ROWS decisions, position ranges from 0 to ROWS → ROWS+1 buckets

        let position = 0; // will add 0 or 1 at each step
        const decisions = [];

        for (let row = 0; row < ROWS; row++) {
            const goRight = Math.random() < 0.5;
            decisions.push(goRight ? 1 : 0);
            position += goRight ? 1 : 0;
        }

        return { finalBucket: position, decisions };
    }

    function buildBallPath(decisions, finalBucket) {
        const path = [];
        path.push({ x: W / 2, y: startY - ballRadius * 2 });

        let col = 0;
        for (let row = 0; row < ROWS; row++) {
            const peg = getPegPosition(row, col);
            path.push({ x: peg.x, y: peg.y - pegRadius - ballRadius });
            col += decisions[row];
            const bounceX = peg.x + (decisions[row] ? 1 : -1) * pegSpacingX * 0.3;
            const bounceY = peg.y + pegSpacingY * 0.3;
            path.push({ x: bounceX, y: bounceY });
        }

        const bucketY = startY + (ROWS + 1) * pegSpacingY + 20;
        path.push({ x: getBucketX(finalBucket), y: bucketY });
        return path;
    }

    function startBall(decisions, finalBucket, betAmount) {
        const path = buildBallPath(decisions, finalBucket);
        activeBalls.push({
            path,
            segmentIndex: 0,
            segmentProgress: 0,
            x: path[0].x,
            y: path[0].y,
            finalBucket,
            bet: betAmount,
            done: false
        });
        if (!animationRunning) {
            animationRunning = true;
            requestAnimationFrame(animate);
        }
    }

    function animate() {
        for (const ball of activeBalls) {
            if (ball.done) continue;
            if (ball.segmentIndex >= ball.path.length - 1) {
                ball.done = true;
                const mult = BUCKET_MULTIPLIERS[ball.finalBucket];
                const winnings = Math.floor(ball.bet * mult);
                addCoins(winnings);
                showResult(mult, winnings - ball.bet);
                continue;
            }

            const from = ball.path[ball.segmentIndex];
            const to = ball.path[ball.segmentIndex + 1];
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.06 * (200 / Math.max(dist, 50));

            ball.segmentProgress += speed;
            if (ball.segmentProgress >= 1) {
                ball.segmentIndex++;
                ball.segmentProgress = 0;
                ball.x = to.x;
                ball.y = to.y;
            } else {
                const t = ball.segmentProgress;
                const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                ball.x = from.x + dx * ease;
                ball.y = from.y + dy * ease;
            }
        }

        const visibleBalls = activeBalls.filter(b => !b.done);
        drawBoard(visibleBalls);

        for (let i = activeBalls.length - 1; i >= 0; i--) {
            if (activeBalls[i].done) activeBalls.splice(i, 1);
        }

        if (activeBalls.length > 0) {
            requestAnimationFrame(animate);
        } else {
            animationRunning = false;
        }
    }

    // ---- Drop Button ----
    dropBtn.addEventListener('click', () => {
        if (coins < bet) {
            showResult(0, 0, true);
            return;
        }

        addCoins(-bet);
        const { decisions, finalBucket } = simulateBallPath();
        startBall(decisions, finalBucket, bet);
    });

    function showResult(mult, net, insufficientFunds) {
        resultPopup.classList.remove('hidden');

        if (insufficientFunds) {
            resultPopup.innerHTML = `
                <div class="result-mult" style="color:#f66">Not enough coins!</div>
                <div class="result-amount loss">You need ${bet} coins to play</div>
            `;
        } else {
            const isWin = net > 0;
            resultPopup.innerHTML = `
                <div class="result-mult" style="color:${multColor(mult)}">${mult}x</div>
                <div class="result-amount ${isWin ? '' : 'loss'}">
                    ${isWin ? '+' : ''}${net.toLocaleString()} coins
                </div>
            `;
        }

        requestAnimationFrame(() => {
            resultPopup.classList.add('show');
        });

        if (resultPopup._dismissTimer) clearTimeout(resultPopup._dismissTimer);

        const dismiss = () => {
            resultPopup.classList.remove('show');
            setTimeout(() => resultPopup.classList.add('hidden'), 300);
        };

        resultPopup.onclick = dismiss;
        resultPopup._dismissTimer = setTimeout(dismiss, 1500);
    }

    // ---- roundRect polyfill ----
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (typeof r === 'number') r = [r, r, r, r];
            this.moveTo(x + r[0], y);
            this.lineTo(x + w - r[1], y);
            this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
            this.lineTo(x + w, y + h - r[2]);
            this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
            this.lineTo(x + r[3], y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
            this.lineTo(x, y + r[0]);
            this.quadraticCurveTo(x, y, x + r[0], y);
            this.closePath();
        };
    }

    // ---- Init ----
    updateCoinDisplay();
    window.addEventListener('resize', () => {
        if (plinkoScreen.classList.contains('active')) {
            resizePlinkoCanvas();
        }
    });
})();
