class DemoCollection {
    constructor() {
        this.currentDemo = null;
        this.animationFrameId = null;
        this.gameLoops = new Map();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showMainMenu();
    }
    
    bindEvents() {
        // Demo card clicks
        document.querySelectorAll('.demo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const demo = e.currentTarget.getAttribute('data-demo');
                this.loadDemo(demo);
            });
        });
        
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.showMainMenu();
            }
        });
    }
    
    showMainMenu() {
        // Clean up current demo
        this.cleanup();
        
        // Show menu, hide demo container
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('demoContainer').style.display = 'none';
        
        this.currentDemo = null;
    }
    
    loadDemo(demoName) {
        // Hide menu, show demo container
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('demoContainer').style.display = 'block';
        
        this.currentDemo = demoName;
        
        // Load specific demo
        switch(demoName) {
            case 'cube3d': this.loadCube3D(); break;
            case 'typewriter': this.loadTypewriter(); break;
            case 'matrix': this.loadMatrix(); break;
            case 'glitch': this.loadGlitch(); break;
            case 'parallax': this.loadParallax(); break;
            case 'snake': this.loadSnake(); break;
            case 'pong': this.loadPong(); break;
            case 'memory': this.loadMemory(); break;
            case 'whackamole': this.loadWhackAMole(); break;
            case 'asteroids': this.loadAsteroids(); break;
            case 'particles': this.loadParticles(); break;
            case 'drawing': this.loadDrawing(); break;
            case 'audio': this.loadAudio(); break;
            case 'clock': this.loadClock(); break;
            case 'weather': this.loadWeather(); break;
            case 'illusion': this.loadIllusion(); break;
            case 'facecursor': this.loadFaceCursor(); break;
            case 'fireworks': this.loadFireworks(); break;
            case 'tiltcard': this.loadTiltCard(); break;
            case 'infinitezoom': this.loadInfiniteZoom(); break;
            default: 
                this.showLoading();
                break;
        }
    }
    
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop all game loops
        this.gameLoops.forEach(loop => clearInterval(loop));
        this.gameLoops.clear();
        
        // Remove event listeners that might be attached to window or document
        document.removeEventListener('mousemove', this.mouseHandler);
        document.removeEventListener('click', this.clickHandler);
        window.removeEventListener('scroll', this.scrollHandler);
    }
    
    showLoading() {
        document.getElementById('demoContent').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }
    
    // === VISUAL DEMOS ===
    
    loadCube3D() {
        document.getElementById('demoContent').innerHTML = `
            <div class="cube-container">
                <div class="cube">
                    <div class="cube-face front">FRONT</div>
                    <div class="cube-face back">BACK</div>
                    <div class="cube-face right">RIGHT</div>
                    <div class="cube-face left">LEFT</div>
                    <div class="cube-face top">TOP</div>
                    <div class="cube-face bottom">BOTTOM</div>
                </div>
            </div>
        `;
    }
    
    loadTypewriter() {
        const messages = [
            "Hello, I'm a typewriter effect! ✨",
            "This text appears character by character...",
            "Just like someone is typing it in real time! ⌨️",
            "Pretty cool, right? Click the button for more!",
            "The quick brown fox jumps over the lazy dog. 🦊",
            "Welcome to the world of web animations! 🌟",
            "JavaScript makes everything possible! 💻"
        ];
        
        document.getElementById('demoContent').innerHTML = `
            <div class="typewriter-demo">
                <h2 style="color: white; margin-bottom: 2rem;">Typewriter Effect Demo</h2>
                <div class="typewriter-display">
                    <span class="typewriter-text" id="typewriterText"></span>
                    <span class="typewriter-cursor">|</span>
                </div>
                <button class="typewriter-btn" id="typewriterBtn">Generate Random Message</button>
            </div>
        `;
        
        let isTyping = false;
        
        const typeText = (text) => {
            if (isTyping) return;
            isTyping = true;
            
            const textElement = document.getElementById('typewriterText');
            textElement.textContent = '';
            
            let index = 0;
            const typeChar = () => {
                if (index < text.length) {
                    textElement.textContent += text.charAt(index);
                    index++;
                    setTimeout(typeChar, 50 + Math.random() * 50);
                } else {
                    isTyping = false;
                }
            };
            typeChar();
        };
        
        document.getElementById('typewriterBtn').addEventListener('click', () => {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            typeText(randomMessage);
        });
        
        // Start with first message
        setTimeout(() => typeText(messages[0]), 500);
    }
    
    loadMatrix() {
        document.getElementById('demoContent').innerHTML = `
            <div class="matrix-container">
                <canvas class="matrix-canvas" id="matrixCanvas"></canvas>
            </div>
        `;
        
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");
        
        const fontSize = 10;
        const columns = canvas.width / fontSize;
        
        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }
        
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px arial';
            
            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        const matrixLoop = setInterval(draw, 35);
        this.gameLoops.set('matrix', matrixLoop);
    }
    
    loadGlitch() {
        document.getElementById('demoContent').innerHTML = `
            <div class="glitch-container">
                <div class="glitch-text" data-text="GLITCH EFFECT">GLITCH EFFECT</div>
            </div>
        `;
    }
    
    loadParallax() {
        document.getElementById('demoContent').innerHTML = `
            <div class="parallax-container">
                <div class="parallax-layer parallax-back"></div>
                <div class="parallax-layer parallax-base">
                    <h1>Parallax Scrolling</h1>
                    <p>Scroll down to see the parallax effect!</p>
                    <div style="height: 200vh; display: flex; flex-direction: column; justify-content: space-around;">
                        <div>
                            <h2>Layer 1</h2>
                            <p>The background moves slower than this text, creating depth.</p>
                        </div>
                        <div>
                            <h2>Layer 2</h2>
                            <p>This creates a 3D-like scrolling experience.</p>
                        </div>
                        <div>
                            <h2>Layer 3</h2>
                            <p>Keep scrolling to see more of the effect!</p>
                        </div>
                        <div>
                            <h2>The End</h2>
                            <p>You've reached the bottom! Press Escape to go back.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // === GAMES ===
    
    loadSnake() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Snake Game</h2>
                <div class="game-info">
                    <span>Score: <span id="snakeScore">0</span></span>
                </div>
                <canvas class="demo-canvas" id="snakeCanvas" width="400" height="400"></canvas>
                <div class="game-controls">
                    <button class="game-btn" id="snakeStart">Start Game</button>
                    <p style="margin-top: 1rem;">Use Arrow Keys to Control</p>
                </div>
            </div>
        `;
        
        this.initSnakeGame();
    }
    
    initSnakeGame() {
        const canvas = document.getElementById('snakeCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('snakeScore');
        
        let snake = [{x: 200, y: 200}];
        let direction = {x: 0, y: 0};
        let food = {x: 0, y: 0};
        let score = 0;
        let gameRunning = false;
        
        const gridSize = 20;
        
        const generateFood = () => {
            food.x = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
            food.y = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
        };
        
        const draw = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw snake
            ctx.fillStyle = '#0f0';
            snake.forEach(segment => {
                ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);
            });
            
            // Draw food
            ctx.fillStyle = '#f00';
            ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);
        };
        
        const update = () => {
            if (!gameRunning) return;
            
            const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
            
            // Check wall collision
            if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
                gameRunning = false;
                alert('Game Over! Score: ' + score);
                return;
            }
            
            // Check self collision
            if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                gameRunning = false;
                alert('Game Over! Score: ' + score);
                return;
            }
            
            snake.unshift(head);
            
            // Check food collision
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                scoreElement.textContent = score;
                generateFood();
            } else {
                snake.pop();
            }
            
            draw();
        };
        
        document.addEventListener('keydown', (e) => {
            if (!gameRunning) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    if (direction.y === 0) direction = {x: 0, y: -gridSize};
                    break;
                case 'ArrowDown':
                    if (direction.y === 0) direction = {x: 0, y: gridSize};
                    break;
                case 'ArrowLeft':
                    if (direction.x === 0) direction = {x: -gridSize, y: 0};
                    break;
                case 'ArrowRight':
                    if (direction.x === 0) direction = {x: gridSize, y: 0};
                    break;
            }
        });
        
        document.getElementById('snakeStart').addEventListener('click', () => {
            snake = [{x: 200, y: 200}];
            direction = {x: 0, y: 0};
            score = 0;
            scoreElement.textContent = score;
            gameRunning = true;
            generateFood();
            draw();
        });
        
        const gameLoop = setInterval(update, 150);
        this.gameLoops.set('snake', gameLoop);
        
        generateFood();
        draw();
    }
    
    loadPong() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Pong Game</h2>
                <div class="game-info">
                    <span>Player 1: <span id="player1Score">0</span></span>
                    <span style="margin: 0 2rem;">Player 2: <span id="player2Score">0</span></span>
                </div>
                <canvas class="demo-canvas" id="pongCanvas" width="600" height="400"></canvas>
                <div class="game-controls">
                    <button class="game-btn" id="pongStart">Start Game</button>
                    <p style="margin-top: 1rem;">Player 1: W/S Keys | Player 2: ↑/↓ Keys</p>
                </div>
            </div>
        `;
        
        this.initPongGame();
    }
    
    initPongGame() {
        const canvas = document.getElementById('pongCanvas');
        const ctx = canvas.getContext('2d');
        
        let gameRunning = false;
        let player1Score = 0;
        let player2Score = 0;
        
        const ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            dx: 3,
            dy: 3,
            radius: 10
        };
        
        const paddle1 = {
            x: 10,
            y: canvas.height / 2 - 50,
            width: 10,
            height: 100,
            dy: 0
        };
        
        const paddle2 = {
            x: canvas.width - 20,
            y: canvas.height / 2 - 50,
            width: 10,
            height: 100,
            dy: 0
        };
        
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        const update = () => {
            if (!gameRunning) return;
            
            // Move paddles
            if (keys['w'] && paddle1.y > 0) paddle1.y -= 5;
            if (keys['s'] && paddle1.y < canvas.height - paddle1.height) paddle1.y += 5;
            if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 5;
            if (keys['ArrowDown'] && paddle2.y < canvas.height - paddle2.height) paddle2.y += 5;
            
            // Move ball
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // Ball collision with top/bottom
            if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) {
                ball.dy = -ball.dy;
            }
            
            // Ball collision with paddles
            if (ball.x <= paddle1.x + paddle1.width && 
                ball.y >= paddle1.y && 
                ball.y <= paddle1.y + paddle1.height) {
                ball.dx = Math.abs(ball.dx);
            }
            
            if (ball.x >= paddle2.x && 
                ball.y >= paddle2.y && 
                ball.y <= paddle2.y + paddle2.height) {
                ball.dx = -Math.abs(ball.dx);
            }
            
            // Score
            if (ball.x < 0) {
                player2Score++;
                document.getElementById('player2Score').textContent = player2Score;
                resetBall();
            }
            
            if (ball.x > canvas.width) {
                player1Score++;
                document.getElementById('player1Score').textContent = player1Score;
                resetBall();
            }
            
            draw();
        };
        
        const resetBall = () => {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
            ball.dy = (Math.random() > 0.5 ? 1 : -1) * 3;
        };
        
        const draw = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw paddles
            ctx.fillStyle = '#fff';
            ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
            ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
            
            // Draw ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw center line
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
        };
        
        document.getElementById('pongStart').addEventListener('click', () => {
            gameRunning = true;
            resetBall();
        });
        
        const gameLoop = setInterval(update, 16);
        this.gameLoops.set('pong', gameLoop);
        
        draw();
    }
    
    // === MORE GAMES ===
    
    loadMemory() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Memory Card Game</h2>
                <div class="game-info">
                    <span>Moves: <span id="moveCount">0</span></span>
                    <span style="margin: 0 2rem;">Matches: <span id="matchCount">0</span></span>
                    <span>Time: <span id="gameTime">0</span>s</span>
                </div>
                <div id="memoryGrid" class="memory-grid"></div>
                <div class="game-controls">
                    <button class="game-btn" id="memoryStart">New Game</button>
                </div>
            </div>
        `;
        
        this.initMemoryGame();
    }
    
    initMemoryGame() {
        const symbols = ['🎯', '🎮', '🎲', '🎪', '🎭', '🎨', '🎸', '🎺'];
        let cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        let flippedCards = [];
        let matchedPairs = 0;
        let moves = 0;
        let startTime = Date.now();
        let gameStarted = false;
        
        const createGrid = () => {
            const grid = document.getElementById('memoryGrid');
            grid.innerHTML = '';
            cards.forEach((symbol, index) => {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.dataset.symbol = symbol;
                card.dataset.index = index;
                card.innerHTML = `
                    <div class="card-inner">
                        <div class="card-front">?</div>
                        <div class="card-back">${symbol}</div>
                    </div>
                `;
                card.addEventListener('click', flipCard);
                grid.appendChild(card);
            });
        };
        
        const flipCard = (e) => {
            const card = e.currentTarget;
            if (card.classList.contains('flipped') || card.classList.contains('matched') || flippedCards.length === 2) return;
            
            if (!gameStarted) {
                gameStarted = true;
                startTimer();
            }
            
            card.classList.add('flipped');
            flippedCards.push(card);
            
            if (flippedCards.length === 2) {
                moves++;
                document.getElementById('moveCount').textContent = moves;
                
                if (flippedCards[0].dataset.symbol === flippedCards[1].dataset.symbol) {
                    // Match found
                    setTimeout(() => {
                        flippedCards.forEach(c => c.classList.add('matched'));
                        flippedCards = [];
                        matchedPairs++;
                        document.getElementById('matchCount').textContent = matchedPairs;
                        
                        if (matchedPairs === symbols.length) {
                            alert(`Congratulations! You won in ${moves} moves!`);
                        }
                    }, 500);
                } else {
                    // No match
                    setTimeout(() => {
                        flippedCards.forEach(c => c.classList.remove('flipped'));
                        flippedCards = [];
                    }, 1000);
                }
            }
        };
        
        const startTimer = () => {
            const timer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('gameTime').textContent = elapsed;
                
                if (matchedPairs === symbols.length) {
                    clearInterval(timer);
                }
            }, 1000);
            this.gameLoops.set('memoryTimer', timer);
        };
        
        document.getElementById('memoryStart').addEventListener('click', () => {
            cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
            flippedCards = [];
            matchedPairs = 0;
            moves = 0;
            gameStarted = false;
            startTime = Date.now();
            
            document.getElementById('moveCount').textContent = '0';
            document.getElementById('matchCount').textContent = '0';
            document.getElementById('gameTime').textContent = '0';
            
            if (this.gameLoops.has('memoryTimer')) {
                clearInterval(this.gameLoops.get('memoryTimer'));
            }
            
            createGrid();
        });
        
        createGrid();
    }
    
    loadWhackAMole() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Whack-a-Mole</h2>
                <div class="game-info">
                    <span>Score: <span id="whackScore">0</span></span>
                    <span style="margin: 0 2rem;">Time: <span id="whackTime">30</span>s</span>
                </div>
                <div id="whackGrid" class="whack-grid">
                    ${Array.from({length: 9}, (_, i) => `
                        <div class="whack-hole" data-index="${i}">
                            <div class="mole">🐹</div>
                        </div>
                    `).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn" id="whackStart">Start Game</button>
                </div>
            </div>
        `;
        
        this.initWhackAMoleGame();
    }
    
    initWhackAMoleGame() {
        let score = 0;
        let timeLeft = 30;
        let gameActive = false;
        let moleTimer = null;
        
        const holes = document.querySelectorAll('.whack-hole');
        
        const showMole = () => {
            if (!gameActive) return;
            
            // Hide all moles
            holes.forEach(hole => hole.classList.remove('active'));
            
            // Show random mole
            const randomHole = holes[Math.floor(Math.random() * holes.length)];
            randomHole.classList.add('active');
            
            // Hide after random time
            setTimeout(() => {
                randomHole.classList.remove('active');
            }, 800 + Math.random() * 400);
        };
        
        holes.forEach(hole => {
            hole.addEventListener('click', () => {
                if (hole.classList.contains('active')) {
                    hole.classList.remove('active');
                    hole.classList.add('whacked');
                    score += 10;
                    document.getElementById('whackScore').textContent = score;
                    
                    setTimeout(() => hole.classList.remove('whacked'), 200);
                }
            });
        });
        
        document.getElementById('whackStart').addEventListener('click', () => {
            score = 0;
            timeLeft = 30;
            gameActive = true;
            
            document.getElementById('whackScore').textContent = '0';
            document.getElementById('whackTime').textContent = '30';
            
            // Game timer
            const gameTimer = setInterval(() => {
                timeLeft--;
                document.getElementById('whackTime').textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    gameActive = false;
                    clearInterval(gameTimer);
                    clearInterval(moleTimer);
                    alert(`Game Over! Final Score: ${score}`);
                }
            }, 1000);
            
            // Mole spawning
            moleTimer = setInterval(showMole, 600);
            this.gameLoops.set('whackMole', moleTimer);
            this.gameLoops.set('whackTimer', gameTimer);
        });
    }
    
    loadAsteroids() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Space Shooter</h2>
                <div class="game-info">
                    <span>Score: <span id="spaceScore">0</span></span>
                    <span style="margin: 0 2rem;">Lives: <span id="spaceLives">3</span></span>
                </div>
                <canvas class="demo-canvas" id="spaceCanvas" width="600" height="400"></canvas>
                <div class="game-controls">
                    <button class="game-btn" id="spaceStart">Start Game</button>
                    <p style="margin-top: 1rem;">Use Arrow Keys to Move, Space to Shoot</p>
                </div>
            </div>
        `;
        
        this.initSpaceGame();
    }
    
    initSpaceGame() {
        const canvas = document.getElementById('spaceCanvas');
        const ctx = canvas.getContext('2d');
        
        let gameRunning = false;
        let score = 0;
        let lives = 3;
        let keys = {};
        
        const player = {
            x: canvas.width / 2,
            y: canvas.height - 50,
            width: 30,
            height: 30,
            speed: 5
        };
        
        let bullets = [];
        let asteroids = [];
        let lastShot = 0;
        
        document.addEventListener('keydown', (e) => keys[e.key] = true);
        document.addEventListener('keyup', (e) => keys[e.key] = false);
        
        const createAsteroid = () => {
            asteroids.push({
                x: Math.random() * canvas.width,
                y: -20,
                width: 20 + Math.random() * 20,
                height: 20 + Math.random() * 20,
                speed: 1 + Math.random() * 3
            });
        };
        
        const update = () => {
            if (!gameRunning) return;
            
            // Move player
            if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
            if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
            if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
            if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
            
            // Shoot
            if (keys[' '] && Date.now() - lastShot > 200) {
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y,
                    width: 3,
                    height: 10,
                    speed: 7
                });
                lastShot = Date.now();
            }
            
            // Move bullets
            bullets = bullets.filter(bullet => {
                bullet.y -= bullet.speed;
                return bullet.y > 0;
            });
            
            // Move asteroids
            asteroids = asteroids.filter(asteroid => {
                asteroid.y += asteroid.speed;
                return asteroid.y < canvas.height;
            });
            
            // Check collisions
            bullets.forEach((bullet, bulletIndex) => {
                asteroids.forEach((asteroid, asteroidIndex) => {
                    if (bullet.x < asteroid.x + asteroid.width &&
                        bullet.x + bullet.width > asteroid.x &&
                        bullet.y < asteroid.y + asteroid.height &&
                        bullet.y + bullet.height > asteroid.y) {
                        bullets.splice(bulletIndex, 1);
                        asteroids.splice(asteroidIndex, 1);
                        score += 10;
                        document.getElementById('spaceScore').textContent = score;
                    }
                });
            });
            
            // Check player-asteroid collision
            asteroids.forEach((asteroid, index) => {
                if (player.x < asteroid.x + asteroid.width &&
                    player.x + player.width > asteroid.x &&
                    player.y < asteroid.y + asteroid.height &&
                    player.y + player.height > asteroid.y) {
                    asteroids.splice(index, 1);
                    lives--;
                    document.getElementById('spaceLives').textContent = lives;
                    
                    if (lives <= 0) {
                        gameRunning = false;
                        alert(`Game Over! Final Score: ${score}`);
                    }
                }
            });
            
            draw();
        };
        
        const draw = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw stars
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
            }
            
            // Draw player
            ctx.fillStyle = '#0f0';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Draw bullets
            ctx.fillStyle = '#ff0';
            bullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            });
            
            // Draw asteroids
            ctx.fillStyle = '#888';
            asteroids.forEach(asteroid => {
                ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
            });
        };
        
        document.getElementById('spaceStart').addEventListener('click', () => {
            gameRunning = true;
            score = 0;
            lives = 3;
            bullets = [];
            asteroids = [];
            player.x = canvas.width / 2;
            player.y = canvas.height - 50;
            
            document.getElementById('spaceScore').textContent = '0';
            document.getElementById('spaceLives').textContent = '3';
            
            // Spawn asteroids
            const asteroidSpawner = setInterval(() => {
                if (gameRunning) createAsteroid();
                else clearInterval(asteroidSpawner);
            }, 1000);
            
            this.gameLoops.set('asteroidSpawner', asteroidSpawner);
        });
        
        const gameLoop = setInterval(update, 16);
        this.gameLoops.set('spaceGame', gameLoop);
    }
    
    // === INTERACTIVE TOYS ===
    
    loadParticles() {
        document.getElementById('demoContent').innerHTML = `
            <div class="canvas-demo">
                <canvas class="demo-canvas" id="particleCanvas" width="800" height="600"></canvas>
            </div>
        `;
        
        this.initParticleSystem();
    }
    
    initParticleSystem() {
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        
        let particles = [];
        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.life = 1;
                this.decay = 0.01;
                this.size = Math.random() * 3 + 1;
                this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            }
            
            update() {
                // Move towards mouse
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 50) {
                    this.vx += dx * 0.0001;
                    this.vy += dy * 0.0001;
                }
                
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.99;
                this.vy *= 0.99;
                this.life -= this.decay;
            }
            
            draw() {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add new particles
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(mouse.x, mouse.y));
            }
            
            // Update and draw particles
            particles = particles.filter(particle => {
                particle.update();
                particle.draw();
                return particle.life > 0;
            });
            
            if (this.currentDemo === 'particles') {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    loadDrawing() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Drawing App</h2>
                <div class="drawing-controls">
                    <input type="color" id="colorPicker" value="#ff0000">
                    <input type="range" id="brushSize" min="1" max="50" value="5">
                    <button class="game-btn" id="clearCanvas">Clear</button>
                </div>
                <canvas class="demo-canvas" id="drawingCanvas" width="800" height="600"></canvas>
                <p style="color: white; margin-top: 1rem;">Click and drag to draw!</p>
            </div>
        `;
        
        this.initDrawingApp();
    }
    
    initDrawingApp() {
        const canvas = document.getElementById('drawingCanvas');
        const ctx = canvas.getContext('2d');
        const colorPicker = document.getElementById('colorPicker');
        const brushSize = document.getElementById('brushSize');
        
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const startDrawing = (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        };
        
        const draw = (e) => {
            if (!isDrawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            ctx.strokeStyle = colorPicker.value;
            ctx.lineWidth = brushSize.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        };
        
        const stopDrawing = () => {
            isDrawing = false;
        };
        
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        document.getElementById('clearCanvas').addEventListener('click', () => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    }
    
    loadClock() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Animated Clock</h2>
                <canvas class="demo-canvas" id="clockCanvas" width="400" height="400"></canvas>
                <div id="digitalTime" style="color: white; font-size: 2rem; margin-top: 1rem;"></div>
            </div>
        `;
        
        this.initClock();
    }
    
    initClock() {
        const canvas = document.getElementById('clockCanvas');
        const ctx = canvas.getContext('2d');
        const digitalTime = document.getElementById('digitalTime');
        
        const drawClock = () => {
            const now = new Date();
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();
            
            // Update digital time
            digitalTime.textContent = now.toLocaleTimeString();
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 150;
            
            // Draw clock face
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw hour markers
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6;
                const x1 = centerX + Math.cos(angle - Math.PI / 2) * (radius - 20);
                const y1 = centerY + Math.sin(angle - Math.PI / 2) * (radius - 20);
                const x2 = centerX + Math.cos(angle - Math.PI / 2) * (radius - 10);
                const y2 = centerY + Math.sin(angle - Math.PI / 2) * (radius - 10);
                
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            // Draw hands
            // Hour hand
            const hourAngle = ((hours + minutes / 60) * Math.PI) / 6;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(hourAngle - Math.PI / 2) * 60,
                centerY + Math.sin(hourAngle - Math.PI / 2) * 60
            );
            ctx.stroke();
            
            // Minute hand
            const minuteAngle = ((minutes + seconds / 60) * Math.PI) / 30;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(minuteAngle - Math.PI / 2) * 90,
                centerY + Math.sin(minuteAngle - Math.PI / 2) * 90
            );
            ctx.stroke();
            
            // Second hand
            const secondAngle = ((seconds + milliseconds / 1000) * Math.PI) / 30;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(secondAngle - Math.PI / 2) * 110,
                centerY + Math.sin(secondAngle - Math.PI / 2) * 110
            );
            ctx.stroke();
            
            // Center dot
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.currentDemo === 'clock') {
                this.animationFrameId = requestAnimationFrame(drawClock);
            }
        };
        
        drawClock();
    }
    
    // === "HOW DID YOU DO THAT?!" DEMOS ===
    
    loadIllusion() {
        document.getElementById('demoContent').innerHTML = `
            <div class="illusion-container">
                <h2 style="color: white; text-align: center; margin-bottom: 2rem;">Optical Illusion</h2>
                <div class="illusion-pattern"></div>
                <p style="color: white; text-align: center; margin-top: 2rem;">
                    Scroll or move your mouse to see the illusion effect!
                </p>
            </div>
        `;
    }
    
    loadFaceCursor() {
        document.getElementById('demoContent').innerHTML = `
            <div class="face-container">
                <h2 style="color: white; text-align: center; margin-bottom: 2rem;">Face Following Cursor</h2>
                <div class="face">
                    <div class="eye left-eye">
                        <div class="eyeball"></div>
                    </div>
                    <div class="eye right-eye">
                        <div class="eyeball"></div>
                    </div>
                    <div class="mouth"></div>
                </div>
                <p style="color: white; text-align: center; margin-top: 2rem;">
                    Move your mouse around to see the eyes follow!
                </p>
            </div>
        `;
        
        this.initFaceCursor();
    }
    
    initFaceCursor() {
        const leftEyeball = document.querySelector('.left-eye .eyeball');
        const rightEyeball = document.querySelector('.right-eye .eyeball');
        const face = document.querySelector('.face');
        
        this.mouseHandler = (e) => {
            const faceRect = face.getBoundingClientRect();
            const faceCenterX = faceRect.left + faceRect.width / 2;
            const faceCenterY = faceRect.top + faceRect.height / 2;
            
            const angle = Math.atan2(e.clientY - faceCenterY, e.clientX - faceCenterX);
            const distance = Math.min(15, Math.sqrt(Math.pow(e.clientX - faceCenterX, 2) + Math.pow(e.clientY - faceCenterY, 2)) / 10);
            
            const eyeX = Math.cos(angle) * distance;
            const eyeY = Math.sin(angle) * distance;
            
            leftEyeball.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
            rightEyeball.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
        };
        
        document.addEventListener('mousemove', this.mouseHandler);
    }
    
    loadFireworks() {
        document.getElementById('demoContent').innerHTML = `
            <div class="canvas-demo">
                <canvas class="demo-canvas" id="fireworksCanvas" width="800" height="600"></canvas>
                <p style="color: white; text-align: center; margin-top: 1rem;">
                    Click anywhere to launch fireworks!
                </p>
            </div>
        `;
        
        this.initFireworks();
    }
    
    initFireworks() {
        const canvas = document.getElementById('fireworksCanvas');
        const ctx = canvas.getContext('2d');
        
        let fireworks = [];
        let particles = [];
        
        canvas.style.background = 'linear-gradient(to bottom, #001122, #003366)';
        
        this.clickHandler = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            createFirework(x, y);
        };
        
        canvas.addEventListener('click', this.clickHandler);
        
        class Firework {
            constructor(startX, startY, targetX, targetY) {
                this.x = startX;
                this.y = startY;
                this.targetX = targetX;
                this.targetY = targetY;
                this.speed = 5;
                this.angle = Math.atan2(targetY - startY, targetX - startX);
                this.distance = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
                this.traveled = 0;
                this.trail = [];
            }
            
            update() {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > 10) this.trail.shift();
                
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.traveled += this.speed;
                
                if (this.traveled >= this.distance) {
                    explode(this.x, this.y);
                    return false;
                }
                return true;
            }
            
            draw() {
                ctx.strokeStyle = '#ffa500';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < this.trail.length; i++) {
                    const point = this.trail[i];
                    if (i === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
            }
        }
        
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.gravity = 0.1;
                this.life = 1;
                this.decay = 0.015;
                this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.gravity;
                this.life -= this.decay;
            }
            
            draw() {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        const createFirework = (targetX, targetY) => {
            fireworks.push(new Firework(canvas.width / 2, canvas.height, targetX, targetY));
        };
        
        const explode = (x, y) => {
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(x, y));
            }
        };
        
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 17, 34, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            fireworks = fireworks.filter(firework => {
                firework.update();
                firework.draw();
                return firework.traveled < firework.distance;
            });
            
            particles = particles.filter(particle => {
                particle.update();
                particle.draw();
                return particle.life > 0;
            });
            
            if (this.currentDemo === 'fireworks') {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    loadTiltCard() {
        document.getElementById('demoContent').innerHTML = `
            <div class="tilt-container">
                <h2 style="color: white; text-align: center; margin-bottom: 2rem;">3D Tilt Card</h2>
                <div class="tilt-card" id="tiltCard">
                    <div class="card-content">
                        <h3>Hover Me!</h3>
                        <p>Move your mouse around this card to see the 3D tilt effect.</p>
                        <div class="card-shine"></div>
                    </div>
                </div>
                <p style="color: white; text-align: center; margin-top: 2rem;">
                    Move your mouse over the card to see the 3D effect!
                </p>
            </div>
        `;
        
        this.initTiltCard();
    }
    
    initTiltCard() {
        const card = document.getElementById('tiltCard');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            const rotateX = (mouseY / rect.height) * 30;
            const rotateY = (mouseX / rect.width) * -30;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            
            // Update shine effect
            const shine = card.querySelector('.card-shine');
            const shineX = (mouseX / rect.width) * 100;
            const shineY = (mouseY / rect.height) * 100;
            shine.style.background = `radial-gradient(circle at ${shineX + 50}% ${shineY + 50}%, rgba(255,255,255,0.3) 0%, transparent 50%)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.querySelector('.card-shine').style.background = 'none';
        });
    }
    
    loadInfiniteZoom() {
        document.getElementById('demoContent').innerHTML = `
            <div class="zoom-container">
                <h2 style="color: white; text-align: center; margin-bottom: 2rem;">Infinite Zoom Effect</h2>
                <div class="zoom-wrapper">
                    <div class="zoom-layer" style="--i: 0;"></div>
                    <div class="zoom-layer" style="--i: 1;"></div>
                    <div class="zoom-layer" style="--i: 2;"></div>
                    <div class="zoom-layer" style="--i: 3;"></div>
                    <div class="zoom-layer" style="--i: 4;"></div>
                </div>
                <p style="color: white; text-align: center; margin-top: 2rem;">
                    Watch as the pattern zooms endlessly inward!
                </p>
            </div>
        `;
    }
    
    loadAudio() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Audio Visualizer</h2>
                <div class="audio-controls">
                    <input type="file" id="audioFile" accept="audio/*" style="display: none;">
                    <button class="game-btn" onclick="document.getElementById('audioFile').click()">Load Audio File</button>
                    <button class="game-btn" id="playPause">Play/Pause</button>
                </div>
                <canvas class="demo-canvas" id="audioCanvas" width="800" height="400"></canvas>
                <audio id="audio" style="width: 100%; margin-top: 1rem;" controls></audio>
                <p style="color: white; margin-top: 1rem;">Load an audio file to see the visualizer!</p>
            </div>
        `;
        
        this.initAudioVisualizer();
    }
    
    initAudioVisualizer() {
        const canvas = document.getElementById('audioCanvas');
        const ctx = canvas.getContext('2d');
        const audio = document.getElementById('audio');
        const audioFile = document.getElementById('audioFile');
        const playPause = document.getElementById('playPause');
        
        let audioContext;
        let analyser;
        let dataArray;
        let source;
        
        audioFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                audio.src = url;
                
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    source = audioContext.createMediaElementSource(audio);
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);
                    
                    analyser.fftSize = 256;
                    dataArray = new Uint8Array(analyser.frequencyBinCount);
                }
            }
        });
        
        playPause.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            } else {
                audio.pause();
            }
        });
        
        const visualize = () => {
            if (analyser && !audio.paused) {
                analyser.getByteFrequencyData(dataArray);
                
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const barWidth = canvas.width / dataArray.length;
                
                for (let i = 0; i < dataArray.length; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;
                    const hue = (i / dataArray.length) * 360;
                    
                    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
                }
            }
            
            if (this.currentDemo === 'audio') {
                this.animationFrameId = requestAnimationFrame(visualize);
            }
        };
        
        visualize();
    }
    
    loadWeather() {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>Weather App</h2>
                <div class="weather-widget">
                    <div class="weather-input">
                        <input type="text" id="cityInput" placeholder="Enter city name..." style="padding: 10px; border-radius: 5px; border: none; margin-right: 10px;">
                        <button class="game-btn" id="getWeather">Get Weather</button>
                    </div>
                    <div id="weatherDisplay" class="weather-display">
                        <p>Enter a city name to get weather information!</p>
                    </div>
                </div>
                <p style="color: white; margin-top: 1rem;">Note: This demo uses a mock weather API for demonstration.</p>
            </div>
        `;
        
        this.initWeatherApp();
    }
    
    initWeatherApp() {
        const cityInput = document.getElementById('cityInput');
        const getWeatherBtn = document.getElementById('getWeather');
        const weatherDisplay = document.getElementById('weatherDisplay');
        
        // Mock weather data for demo purposes
        const mockWeatherData = {
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 50) + 30,
            windSpeed: Math.floor(Math.random() * 20) + 5
        };
        
        const getWeatherIcon = (condition) => {
            const icons = {
                'Sunny': '☀️',
                'Cloudy': '☁️',
                'Rainy': '🌧️',
                'Snowy': '❄️'
            };
            return icons[condition] || '🌤️';
        };
        
        getWeatherBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (!city) return;
            
            weatherDisplay.innerHTML = '<p>Loading weather data...</p>';
            
            // Simulate API call delay
            setTimeout(() => {
                const weather = {
                    ...mockWeatherData,
                    temperature: Math.floor(Math.random() * 30) + 10,
                    condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)]
                };
                
                weatherDisplay.innerHTML = `
                    <div class="weather-card">
                        <h3>${city}</h3>
                        <div class="weather-main">
                            <span class="weather-icon">${getWeatherIcon(weather.condition)}</span>
                            <span class="temperature">${weather.temperature}°C</span>
                        </div>
                        <p class="condition">${weather.condition}</p>
                        <div class="weather-details">
                            <span>Humidity: ${weather.humidity}%</span>
                            <span>Wind: ${weather.windSpeed} km/h</span>
                        </div>
                    </div>
                `;
            }, 1000);
        });
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                getWeatherBtn.click();
            }
        });
    }
    
    showPlaceholder(title, description) {
        document.getElementById('demoContent').innerHTML = `
            <div class="game-container">
                <h2>${title}</h2>
                <p style="margin: 2rem 0; font-size: 1.2rem; max-width: 600px;">${description}</p>
                <div style="padding: 3rem; background: rgba(255,255,255,0.1); border-radius: 15px; margin: 2rem;">
                    <h3>🚧 Coming Soon!</h3>
                    <p>This demo is being developed. Check back soon!</p>
                    <p style="margin-top: 1rem; opacity: 0.7;">Press Escape or click the back button to return to the menu.</p>
                </div>
            </div>
        `;
    }
}

// Initialize the demo collection when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DemoCollection();
});

// Global utility functions
window.DemoUtils = {
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    lerp: (start, end, factor) => start + (end - start) * factor
};
