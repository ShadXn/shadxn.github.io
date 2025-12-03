class IdleGame {
    constructor() {
        this.gameState = {
            level: 1,
            xp: 0,
            xpNeeded: 100,
            gold: 0,
            unlockedActions: ['foraging'],
            upgrades: {
                foragingPower: 0,
                foragingGold: 0,
                huntingPower: 0,
                huntingGold: 0,
                miningPower: 0,
                miningGold: 0,
                questingPower: 0,
                questingGold: 0
            }
        };

        this.actions = {
            foraging: {
                id: 'foraging',
                name: 'Foraging',
                icon: '🌿',
                description: 'Gather herbs and berries',
                baseXP: 10,
                baseGold: 5,
                unlockLevel: 1,
                duration: 1000
            },
            hunting: {
                id: 'hunting',
                name: 'Hunting',
                icon: '🏹',
                description: 'Hunt wild animals',
                baseXP: 25,
                baseGold: 15,
                unlockLevel: 3,
                duration: 2000
            },
            mining: {
                id: 'mining',
                name: 'Mining',
                icon: '⛏️',
                description: 'Mine precious ores',
                baseXP: 50,
                baseGold: 30,
                unlockLevel: 6,
                duration: 3000
            },
            questing: {
                id: 'questing',
                name: 'Questing',
                icon: '⚔️',
                description: 'Complete epic quests',
                baseXP: 100,
                baseGold: 60,
                unlockLevel: 10,
                duration: 4000
            }
        };

        this.upgradeDefinitions = {
            foragingPower: {
                id: 'foragingPower',
                name: 'Better Foraging',
                icon: '🌿',
                description: 'Increase XP from foraging',
                action: 'foraging',
                type: 'xp',
                baseCost: 20,
                costMultiplier: 1.5,
                effect: 5
            },
            foragingGold: {
                id: 'foragingGold',
                name: 'Foraging Profits',
                icon: '💰',
                description: 'Increase gold from foraging',
                action: 'foraging',
                type: 'gold',
                baseCost: 25,
                costMultiplier: 1.5,
                effect: 3
            },
            huntingPower: {
                id: 'huntingPower',
                name: 'Better Hunting',
                icon: '🏹',
                description: 'Increase XP from hunting',
                action: 'hunting',
                type: 'xp',
                baseCost: 50,
                costMultiplier: 1.6,
                effect: 10,
                unlockLevel: 3
            },
            huntingGold: {
                id: 'huntingGold',
                name: 'Hunting Profits',
                icon: '💰',
                description: 'Increase gold from hunting',
                action: 'hunting',
                type: 'gold',
                baseCost: 60,
                costMultiplier: 1.6,
                effect: 8,
                unlockLevel: 3
            },
            miningPower: {
                id: 'miningPower',
                name: 'Better Mining',
                icon: '⛏️',
                description: 'Increase XP from mining',
                action: 'mining',
                type: 'xp',
                baseCost: 100,
                costMultiplier: 1.7,
                effect: 20,
                unlockLevel: 6
            },
            miningGold: {
                id: 'miningGold',
                name: 'Mining Profits',
                icon: '💰',
                description: 'Increase gold from mining',
                action: 'mining',
                type: 'gold',
                baseCost: 120,
                costMultiplier: 1.7,
                effect: 15,
                unlockLevel: 6
            },
            questingPower: {
                id: 'questingPower',
                name: 'Better Questing',
                icon: '⚔️',
                description: 'Increase XP from questing',
                action: 'questing',
                type: 'xp',
                baseCost: 200,
                costMultiplier: 1.8,
                effect: 40,
                unlockLevel: 10
            },
            questingGold: {
                id: 'questingGold',
                name: 'Questing Profits',
                icon: '💰',
                description: 'Increase gold from questing',
                action: 'questing',
                type: 'gold',
                baseCost: 250,
                costMultiplier: 1.8,
                effect: 30,
                unlockLevel: 10
            }
        };

        this.activeActions = {};
        this.init();
    }

    init() {
        this.loadGame();
        this.renderActions();
        this.renderUpgrades();
        this.updateUI();
        this.setupEventListeners();
        this.startAutoSave();
        this.checkLevelUnlocks();
    }

    setupEventListeners() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveGame();
            this.showNotification('Game saved!');
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your game? This cannot be undone!')) {
                localStorage.removeItem('idleGameSave');
                location.reload();
            }
        });
    }

    renderActions() {
        const actionsContainer = document.getElementById('actions');
        actionsContainer.innerHTML = '';

        Object.values(this.actions).forEach(action => {
            const isUnlocked = this.gameState.unlockedActions.includes(action.id);
            const canUnlock = this.gameState.level >= action.unlockLevel;

            const card = document.createElement('div');
            card.className = `action-card ${!isUnlocked && !canUnlock ? 'locked' : ''}`;

            const xpReward = this.calculateReward(action, 'xp');
            const goldReward = this.calculateReward(action, 'gold');

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${action.icon}</div>
                    <div class="card-title">${action.name}</div>
                    ${!isUnlocked && canUnlock ? '<span class="unlock-badge">NEW!</span>' : ''}
                </div>
                <div class="card-description">${action.description}</div>
                <div class="card-rewards">
                    <span class="reward xp">+${xpReward} XP</span>
                    <span class="reward gold">+${goldReward} Gold</span>
                </div>
                ${!isUnlocked ? `<div style="color: #ef4444; font-size: 0.85rem;">Unlocks at level ${action.unlockLevel}</div>` : ''}
                <button class="action-btn" id="action-${action.id}" ${!isUnlocked ? 'disabled' : ''}>
                    ${!isUnlocked ? '🔒 Locked' : 'Start'}
                </button>
                <div class="progress-bar" id="progress-${action.id}" style="display: none;">
                    <div class="progress-fill" id="progress-fill-${action.id}"></div>
                </div>
            `;

            actionsContainer.appendChild(card);

            if (isUnlocked) {
                document.getElementById(`action-${action.id}`).addEventListener('click', () => {
                    this.startAction(action);
                });
            }
        });
    }

    renderUpgrades() {
        const upgradesContainer = document.getElementById('upgrades');
        upgradesContainer.innerHTML = '';

        Object.values(this.upgradeDefinitions).forEach(upgrade => {
            const currentLevel = this.gameState.upgrades[upgrade.id] || 0;
            const cost = this.calculateUpgradeCost(upgrade, currentLevel);
            const canAfford = this.gameState.gold >= cost;
            const isUnlocked = !upgrade.unlockLevel || this.gameState.level >= upgrade.unlockLevel;
            const maxLevel = 20;
            const isMaxed = currentLevel >= maxLevel;

            const card = document.createElement('div');
            card.className = `upgrade-card ${!isUnlocked ? 'locked' : ''}`;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${upgrade.icon}</div>
                    <div class="card-title">${upgrade.name}</div>
                </div>
                <div class="card-description">${upgrade.description}</div>
                <div class="upgrade-level">Level: ${currentLevel}/${maxLevel}</div>
                <div style="margin-top: 5px; color: #10b981; font-weight: bold;">+${upgrade.effect * (currentLevel + 1)} ${upgrade.type}</div>
                ${!isUnlocked ? `<div style="color: #ef4444; font-size: 0.85rem; margin-top: 5px;">Unlocks at level ${upgrade.unlockLevel}</div>` : ''}
                <button class="upgrade-btn" id="upgrade-${upgrade.id}" ${!canAfford || !isUnlocked || isMaxed ? 'disabled' : ''}>
                    ${isMaxed ? 'MAX' : `Upgrade (${cost} gold)`}
                </button>
            `;

            upgradesContainer.appendChild(card);

            if (isUnlocked && !isMaxed) {
                document.getElementById(`upgrade-${upgrade.id}`).addEventListener('click', () => {
                    this.purchaseUpgrade(upgrade);
                });
            }
        });
    }

    calculateReward(action, type) {
        const base = type === 'xp' ? action.baseXP : action.baseGold;
        const upgradeKey = `${action.id}${type === 'xp' ? 'Power' : 'Gold'}`;
        const upgradeLevel = this.gameState.upgrades[upgradeKey] || 0;
        const upgrade = this.upgradeDefinitions[upgradeKey];

        if (!upgrade) return base;

        return base + (upgrade.effect * upgradeLevel);
    }

    calculateUpgradeCost(upgrade, currentLevel) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    startAction(action) {
        if (this.activeActions[action.id]) return;

        const button = document.getElementById(`action-${action.id}`);
        const progressBar = document.getElementById(`progress-${action.id}`);
        const progressFill = document.getElementById(`progress-fill-${action.id}`);

        button.disabled = true;
        progressBar.style.display = 'block';

        const startTime = Date.now();
        const duration = action.duration;

        this.activeActions[action.id] = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            progressFill.style.width = `${progress}%`;

            if (progress >= 100) {
                this.completeAction(action);
            }
        }, 50);
    }

    completeAction(action) {
        clearInterval(this.activeActions[action.id]);
        delete this.activeActions[action.id];

        const xpGained = this.calculateReward(action, 'xp');
        const goldGained = this.calculateReward(action, 'gold');

        this.gameState.xp += xpGained;
        this.gameState.gold += goldGained;

        this.checkLevelUp();
        this.updateUI();
        this.renderUpgrades();

        const button = document.getElementById(`action-${action.id}`);
        const progressBar = document.getElementById(`progress-${action.id}`);
        const progressFill = document.getElementById(`progress-fill-${action.id}`);

        button.disabled = false;
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
    }

    checkLevelUp() {
        while (this.gameState.xp >= this.gameState.xpNeeded) {
            this.gameState.xp -= this.gameState.xpNeeded;
            this.gameState.level++;
            this.gameState.xpNeeded = Math.floor(this.gameState.xpNeeded * 1.5);

            this.showNotification(`🎉 Level Up! You are now level ${this.gameState.level}!`, true);
            this.checkLevelUnlocks();
        }
    }

    checkLevelUnlocks() {
        let unlocked = false;

        Object.values(this.actions).forEach(action => {
            if (this.gameState.level >= action.unlockLevel &&
                !this.gameState.unlockedActions.includes(action.id)) {
                this.gameState.unlockedActions.push(action.id);
                this.showNotification(`🎊 New action unlocked: ${action.name}!`);
                unlocked = true;
            }
        });

        if (unlocked) {
            this.renderActions();
            this.renderUpgrades();
        }
    }

    purchaseUpgrade(upgrade) {
        const currentLevel = this.gameState.upgrades[upgrade.id] || 0;
        const cost = this.calculateUpgradeCost(upgrade, currentLevel);

        if (this.gameState.gold >= cost) {
            this.gameState.gold -= cost;
            this.gameState.upgrades[upgrade.id] = currentLevel + 1;
            this.updateUI();
            this.renderActions();
            this.renderUpgrades();
            this.showNotification(`⬆️ Upgraded ${upgrade.name}!`);
        }
    }

    updateUI() {
        document.getElementById('level').textContent = this.gameState.level;
        document.getElementById('xp').textContent = Math.floor(this.gameState.xp);
        document.getElementById('xpNeeded').textContent = this.gameState.xpNeeded;
        document.getElementById('gold').textContent = Math.floor(this.gameState.gold);

        if (this.gameState.level >= 15) {
            this.showNotification('🏆 Congratulations! You\'ve completed the game! Feel free to keep playing or reset for a new run.', true);
        }
    }

    showNotification(message, isLevelUp = false) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${isLevelUp ? 'level-up' : ''}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    saveGame() {
        localStorage.setItem('idleGameSave', JSON.stringify(this.gameState));
    }

    loadGame() {
        const saved = localStorage.getItem('idleGameSave');
        if (saved) {
            this.gameState = JSON.parse(saved);
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, 10000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IdleGame();
});
