// ============================================================
//  MINI CASINO — Main Game Script
// ============================================================

(() => {
    // ---- State ----
    let coins = parseInt(localStorage.getItem('casino_coins') || '0', 10);
    let bet = 10;
    const BET_STEPS = [5, 10, 25, 50, 100, 250, 500];
    let betIndex = 1;
    let ballDropping = false;

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
            // Bucket center X: align with possible landing positions
            const pegsInLastRow = ROWS + 1; // row ROWS-1 has ROWS+1 pegs
            const totalWidth = ROWS * pegSpacingX; // ROWS pegs spacing for ROWS+1 pegs
            const offsetX = (W - totalWidth) / 2;
            // Landing positions are between pegs and at edges
            // Actually for plinko, after the last row of pegs, the ball lands in one of ROWS+1 slots
            // The slots align with the spaces between pegs of the last row
            // Last row (row = ROWS-1) has ROWS+1 pegs
            // Slots are at the midpoints and edges? No — the ball bounces left or right at each peg.
            // After ROWS rows, there are ROWS+1 possible positions.
            // These map to x-positions that line up with a row that would have ROWS+2 pegs.
            const finalRowPegs = ROWS + 2; // virtual row
            const finalTotalWidth = (finalRowPegs - 1) * pegSpacingX;
            const finalOffsetX = (W - finalTotalWidth) / 2;
            const bx = finalOffsetX + i * pegSpacingX;
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
            const finalRowPegs = ROWS + 2;
            const finalTotalWidth = (finalRowPegs - 1) * pegSpacingX;
            const finalOffsetX = (W - finalTotalWidth) / 2;
            const dx = finalOffsetX + (i - 0.5) * pegSpacingX;
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

    function animateBall(decisions, finalBucket) {
        return new Promise(resolve => {
            // Build the path as x,y coordinates through peg positions
            const path = [];

            // Start position — top center
            const startX = W / 2;
            path.push({ x: startX, y: startY - ballRadius * 2 });

            // Track column index at each row
            let col = 0;
            for (let row = 0; row < ROWS; row++) {
                // Peg the ball hits this row
                const peg = getPegPosition(row, col);
                // Ball arrives at peg
                path.push({ x: peg.x, y: peg.y - pegRadius - ballRadius });

                // Bounce left or right
                col += decisions[row];
                const nextX = (row < ROWS - 1)
                    ? getPegPosition(row + 1, col).x
                    : (() => {
                        // Final landing position (virtual row for bucket centers)
                        const finalRowPegs = ROWS + 2;
                        const finalTotalWidth = (finalRowPegs - 1) * pegSpacingX;
                        const finalOffsetX = (W - finalTotalWidth) / 2;
                        return finalOffsetX + finalBucket * pegSpacingX;
                    })();

                // Bounce point slightly below peg
                const bounceX = peg.x + (decisions[row] ? 1 : -1) * pegSpacingX * 0.3;
                const bounceY = peg.y + pegSpacingY * 0.3;
                path.push({ x: bounceX, y: bounceY });
            }

            // Final landing
            const bucketY = startY + (ROWS + 1) * pegSpacingY + 20;
            const finalRowPegs = ROWS + 2;
            const finalTotalWidth = (finalRowPegs - 1) * pegSpacingX;
            const finalOffsetX = (W - finalTotalWidth) / 2;
            const finalX = finalOffsetX + finalBucket * pegSpacingX;
            path.push({ x: finalX, y: bucketY });

            // Animate along path
            let segmentIndex = 0;
            let segmentProgress = 0;
            const baseSpeed = 0.06; // progress per frame at normal speed

            const ball = { x: path[0].x, y: path[0].y };

            function frame() {
                if (segmentIndex >= path.length - 1) {
                    drawBoard([ball]);
                    resolve(finalBucket);
                    return;
                }

                const from = path[segmentIndex];
                const to = path[segmentIndex + 1];
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const speed = baseSpeed * (200 / Math.max(dist, 50));

                segmentProgress += speed;

                if (segmentProgress >= 1) {
                    segmentIndex++;
                    segmentProgress = 0;
                    ball.x = to.x;
                    ball.y = to.y;
                } else {
                    // Ease
                    const t = segmentProgress;
                    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    ball.x = from.x + dx * ease;
                    ball.y = from.y + dy * ease;
                }

                drawBoard([ball]);
                requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);
        });
    }

    // ---- Drop Button ----
    dropBtn.addEventListener('click', async () => {
        if (ballDropping) return;
        if (coins < bet) {
            showResult(0, 0, true);
            return;
        }

        ballDropping = true;
        dropBtn.disabled = true;
        addCoins(-bet);

        const { decisions, finalBucket } = simulateBallPath();
        await animateBall(decisions, finalBucket);

        const mult = BUCKET_MULTIPLIERS[finalBucket];
        const winnings = Math.floor(bet * mult);

        addCoins(winnings);
        showResult(mult, winnings);

        ballDropping = false;
        dropBtn.disabled = false;
    });

    function showResult(mult, amount, insufficientFunds) {
        resultPopup.classList.remove('hidden');

        if (insufficientFunds) {
            resultPopup.innerHTML = `
                <div class="result-mult" style="color:#f66">Not enough coins!</div>
                <div class="result-amount loss">You need ${bet} coins to play</div>
            `;
        } else {
            const net = amount - bet;
            const isWin = net > 0;
            resultPopup.innerHTML = `
                <div class="result-mult" style="color:${multColor(mult)}">${mult}x</div>
                <div class="result-amount ${isWin ? '' : 'loss'}">
                    ${isWin ? '+' : ''}${net.toLocaleString()} coins
                </div>
            `;
        }

        // Create overlay
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
        }

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            resultPopup.classList.add('show');
        });

        const dismiss = () => {
            overlay.classList.remove('show');
            resultPopup.classList.remove('show');
            setTimeout(() => {
                resultPopup.classList.add('hidden');
                overlay.remove();
            }, 300);
        };

        overlay.onclick = dismiss;
        resultPopup.onclick = dismiss;
        setTimeout(dismiss, 2500);
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
