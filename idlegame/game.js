class IdleGame {
    constructor() {
        this.gameState = {
            level: 1,
            xp: 0,
            xpNeeded: 100,
            gold: 0,
            gems: 0,
            maxActiveActions: 1,
            unlockedActions: ['foraging', 'clicking'],
            unlockedAchievements: [],
            darkMode: false,
            actionStats: {
                clicking: { level: 1, xp: 0, xpNeeded: 30, timesCompleted: 0 },
                foraging: { level: 1, xp: 0, xpNeeded: 50, timesCompleted: 0 },
                hunting: { level: 1, xp: 0, xpNeeded: 75, timesCompleted: 0 },
                mining: { level: 1, xp: 0, xpNeeded: 100, timesCompleted: 0 },
                questing: { level: 1, xp: 0, xpNeeded: 150, timesCompleted: 0 },
                fishing: { level: 1, xp: 0, xpNeeded: 60, timesCompleted: 0 },
                crafting: { level: 1, xp: 0, xpNeeded: 80, timesCompleted: 0 },
                exploring: { level: 1, xp: 0, xpNeeded: 120, timesCompleted: 0 },
                trading: { level: 1, xp: 0, xpNeeded: 90, timesCompleted: 0 }
            },
            upgrades: {},
            totalGoldEarned: 0,
            totalActionsCompleted: 0,
            totalClicks: 0,
            totalUpgradesBought: 0,
            clickerProgress: 0,
            activeActionIds: [],
            startTime: Date.now(),
            maxLevelNotificationShown: false
        };

        this.actions = {
            clicking: {
                id: 'clicking',
                name: 'Clicking',
                icon: '👆',
                description: 'Click to gain progress!',
                baseXP: 15,
                baseGold: 10,
                unlockLevel: 1,
                type: 'clicker',
                clicksNeeded: 10
            },
            foraging: {
                id: 'foraging',
                name: 'Foraging',
                icon: '🌿',
                description: 'Gather herbs and berries',
                baseXP: 10,
                baseGold: 5,
                unlockLevel: 1,
                duration: 1000,
                type: 'idle'
            },
            fishing: {
                id: 'fishing',
                name: 'Fishing',
                icon: '🎣',
                description: 'Catch fish from rivers',
                baseXP: 15,
                baseGold: 8,
                unlockLevel: 2,
                duration: 1500,
                type: 'idle'
            },
            hunting: {
                id: 'hunting',
                name: 'Hunting',
                icon: '🏹',
                description: 'Hunt wild animals',
                baseXP: 25,
                baseGold: 15,
                unlockLevel: 4,
                duration: 2000,
                type: 'idle'
            },
            crafting: {
                id: 'crafting',
                name: 'Crafting',
                icon: '🔨',
                description: 'Craft valuable items',
                baseXP: 35,
                baseGold: 20,
                unlockLevel: 7,
                duration: 2500,
                type: 'idle'
            },
            mining: {
                id: 'mining',
                name: 'Mining',
                icon: '⛏️',
                description: 'Mine precious ores',
                baseXP: 50,
                baseGold: 30,
                unlockLevel: 10,
                duration: 3000,
                type: 'idle'
            },
            trading: {
                id: 'trading',
                name: 'Trading',
                icon: '💼',
                description: 'Trade goods for profit',
                baseXP: 70,
                baseGold: 45,
                unlockLevel: 14,
                duration: 3500,
                type: 'idle'
            },
            exploring: {
                id: 'exploring',
                name: 'Exploring',
                icon: '🗺️',
                description: 'Explore dangerous dungeons',
                baseXP: 90,
                baseGold: 55,
                unlockLevel: 18,
                duration: 4000,
                type: 'idle'
            },
            questing: {
                id: 'questing',
                name: 'Questing',
                icon: '⚔️',
                description: 'Complete epic quests',
                baseXP: 120,
                baseGold: 70,
                unlockLevel: 22,
                duration: 4500,
                type: 'idle'
            }
        };

        this.upgradeDefinitions = {
            clickingPower: {
                id: 'clickingPower',
                name: 'Clicking Mastery',
                icon: '👆',
                description: 'Increase XP from clicking',
                action: 'clicking',
                type: 'xp',
                baseCost: 15,
                costMultiplier: 1.4,
                effect: 8
            },
            clickingGold: {
                id: 'clickingGold',
                name: 'Clicking Profits',
                icon: '💰',
                description: 'Increase gold from clicking',
                action: 'clicking',
                type: 'gold',
                baseCost: 20,
                costMultiplier: 1.4,
                effect: 6
            },
            clickingSpeed: {
                id: 'clickingSpeed',
                name: 'Fast Clicking',
                icon: '⚡',
                description: 'Reduce clicks needed',
                action: 'clicking',
                type: 'speed',
                baseCost: 25,
                costMultiplier: 1.5,
                effect: 1,
                unlockLevel: 3
            },
            foragingPower: {
                id: 'foragingPower',
                name: 'Foraging Mastery',
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
            foragingSpeed: {
                id: 'foragingSpeed',
                name: 'Fast Foraging',
                icon: '⚡',
                description: 'Reduce foraging time',
                action: 'foraging',
                type: 'speed',
                baseCost: 30,
                costMultiplier: 1.6,
                effect: 50,
                unlockLevel: 3
            },
            fishingPower: {
                id: 'fishingPower',
                name: 'Fishing Mastery',
                icon: '🎣',
                description: 'Increase XP from fishing',
                action: 'fishing',
                type: 'xp',
                baseCost: 30,
                costMultiplier: 1.5,
                effect: 6,
                unlockLevel: 2
            },
            fishingGold: {
                id: 'fishingGold',
                name: 'Fishing Profits',
                icon: '💰',
                description: 'Increase gold from fishing',
                action: 'fishing',
                type: 'gold',
                baseCost: 35,
                costMultiplier: 1.5,
                effect: 4,
                unlockLevel: 2
            },
            fishingSpeed: {
                id: 'fishingSpeed',
                name: 'Fast Fishing',
                icon: '⚡',
                description: 'Reduce fishing time',
                action: 'fishing',
                type: 'speed',
                baseCost: 40,
                costMultiplier: 1.6,
                effect: 75,
                unlockLevel: 5
            },
            huntingPower: {
                id: 'huntingPower',
                name: 'Hunting Mastery',
                icon: '🏹',
                description: 'Increase XP from hunting',
                action: 'hunting',
                type: 'xp',
                baseCost: 50,
                costMultiplier: 1.6,
                effect: 10,
                unlockLevel: 4
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
                unlockLevel: 4
            },
            huntingSpeed: {
                id: 'huntingSpeed',
                name: 'Fast Hunting',
                icon: '⚡',
                description: 'Reduce hunting time',
                action: 'hunting',
                type: 'speed',
                baseCost: 70,
                costMultiplier: 1.7,
                effect: 100,
                unlockLevel: 8
            },
            craftingPower: {
                id: 'craftingPower',
                name: 'Crafting Mastery',
                icon: '🔨',
                description: 'Increase XP from crafting',
                action: 'crafting',
                type: 'xp',
                baseCost: 75,
                costMultiplier: 1.6,
                effect: 15,
                unlockLevel: 7
            },
            craftingGold: {
                id: 'craftingGold',
                name: 'Crafting Profits',
                icon: '💰',
                description: 'Increase gold from crafting',
                action: 'crafting',
                type: 'gold',
                baseCost: 85,
                costMultiplier: 1.6,
                effect: 10,
                unlockLevel: 7
            },
            craftingSpeed: {
                id: 'craftingSpeed',
                name: 'Fast Crafting',
                icon: '⚡',
                description: 'Reduce crafting time',
                action: 'crafting',
                type: 'speed',
                baseCost: 95,
                costMultiplier: 1.7,
                effect: 125,
                unlockLevel: 11
            },
            miningPower: {
                id: 'miningPower',
                name: 'Mining Mastery',
                icon: '⛏️',
                description: 'Increase XP from mining',
                action: 'mining',
                type: 'xp',
                baseCost: 100,
                costMultiplier: 1.7,
                effect: 20,
                unlockLevel: 10
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
                unlockLevel: 10
            },
            miningSpeed: {
                id: 'miningSpeed',
                name: 'Fast Mining',
                icon: '⚡',
                description: 'Reduce mining time',
                action: 'mining',
                type: 'speed',
                baseCost: 140,
                costMultiplier: 1.8,
                effect: 150,
                unlockLevel: 15
            },
            tradingPower: {
                id: 'tradingPower',
                name: 'Trading Mastery',
                icon: '💼',
                description: 'Increase XP from trading',
                action: 'trading',
                type: 'xp',
                baseCost: 150,
                costMultiplier: 1.7,
                effect: 25,
                unlockLevel: 14
            },
            tradingGold: {
                id: 'tradingGold',
                name: 'Trading Profits',
                icon: '💰',
                description: 'Increase gold from trading',
                action: 'trading',
                type: 'gold',
                baseCost: 175,
                costMultiplier: 1.7,
                effect: 20,
                unlockLevel: 14
            },
            tradingSpeed: {
                id: 'tradingSpeed',
                name: 'Fast Trading',
                icon: '⚡',
                description: 'Reduce trading time',
                action: 'trading',
                type: 'speed',
                baseCost: 200,
                costMultiplier: 1.8,
                effect: 175,
                unlockLevel: 19
            },
            exploringPower: {
                id: 'exploringPower',
                name: 'Exploring Mastery',
                icon: '🗺️',
                description: 'Increase XP from exploring',
                action: 'exploring',
                type: 'xp',
                baseCost: 200,
                costMultiplier: 1.8,
                effect: 30,
                unlockLevel: 18
            },
            exploringGold: {
                id: 'exploringGold',
                name: 'Exploring Profits',
                icon: '💰',
                description: 'Increase gold from exploring',
                action: 'exploring',
                type: 'gold',
                baseCost: 225,
                costMultiplier: 1.8,
                effect: 25,
                unlockLevel: 18
            },
            exploringSpeed: {
                id: 'exploringSpeed',
                name: 'Fast Exploring',
                icon: '⚡',
                description: 'Reduce exploring time',
                action: 'exploring',
                type: 'speed',
                baseCost: 250,
                costMultiplier: 1.9,
                effect: 200,
                unlockLevel: 23
            },
            questingPower: {
                id: 'questingPower',
                name: 'Questing Mastery',
                icon: '⚔️',
                description: 'Increase XP from questing',
                action: 'questing',
                type: 'xp',
                baseCost: 250,
                costMultiplier: 1.8,
                effect: 40,
                unlockLevel: 22
            },
            questingGold: {
                id: 'questingGold',
                name: 'Questing Profits',
                icon: '💰',
                description: 'Increase gold from questing',
                action: 'questing',
                type: 'gold',
                baseCost: 300,
                costMultiplier: 1.8,
                effect: 30,
                unlockLevel: 22
            },
            questingSpeed: {
                id: 'questingSpeed',
                name: 'Fast Questing',
                icon: '⚡',
                description: 'Reduce questing time',
                action: 'questing',
                type: 'speed',
                baseCost: 350,
                costMultiplier: 1.9,
                effect: 225,
                unlockLevel: 27
            }
        };

        this.achievements = {
            // First Time Achievements
            firstClick: {
                id: 'firstClick',
                name: 'First Click',
                icon: '👆',
                description: 'Click for the first time',
                requirement: () => this.gameState.totalClicks >= 1,
                reward: { type: 'gold', amount: 25 }
            },
            firstStep: {
                id: 'firstStep',
                name: 'First Steps',
                icon: '👣',
                description: 'Complete your first action',
                requirement: () => this.gameState.totalActionsCompleted >= 1,
                reward: { type: 'gold', amount: 50 }
            },
            firstUpgrade: {
                id: 'firstUpgrade',
                name: 'First Upgrade',
                icon: '⬆️',
                description: 'Purchase your first upgrade',
                requirement: () => this.gameState.totalUpgradesBought >= 1,
                reward: { type: 'gold', amount: 50 }
            },

            // Level Achievements
            level5: {
                id: 'level5',
                name: 'Getting Started',
                icon: '🎯',
                description: 'Reach level 5',
                requirement: () => this.gameState.level >= 5,
                reward: { type: 'gold', amount: 100 }
            },
            level10: {
                id: 'level10',
                name: 'Rising Star',
                icon: '⭐',
                description: 'Reach level 10',
                requirement: () => this.gameState.level >= 10,
                reward: { type: 'gems', amount: 1 }
            },
            level20: {
                id: 'level20',
                name: 'Champion',
                icon: '🏆',
                description: 'Reach level 20',
                requirement: () => this.gameState.level >= 20,
                reward: { type: 'gems', amount: 3 }
            },
            level30: {
                id: 'level30',
                name: 'Legend',
                icon: '👑',
                description: 'Reach level 30',
                requirement: () => this.gameState.level >= 30,
                reward: { type: 'gems', amount: 5 }
            },
            goldCollector: {
                id: 'goldCollector',
                name: 'Gold Collector',
                icon: '💰',
                description: 'Earn 1,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 1000,
                reward: { type: 'gold', amount: 200 }
            },
            goldMaster: {
                id: 'goldMaster',
                name: 'Gold Master',
                icon: '💎',
                description: 'Earn 10,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 10000,
                reward: { type: 'gems', amount: 5 }
            },
            actionAddict: {
                id: 'actionAddict',
                name: 'Action Addict',
                icon: '🔥',
                description: 'Complete 100 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 100,
                reward: { type: 'gold', amount: 300 }
            },
            actionMaster: {
                id: 'actionMaster',
                name: 'Action Master',
                icon: '💪',
                description: 'Complete 500 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 500,
                reward: { type: 'gems', amount: 3 }
            },
            // Clicking Skill Achievements
            clickingEnthusiast: {
                id: 'clickingEnthusiast',
                name: 'Clicking Enthusiast',
                icon: '👆',
                description: 'Reach clicking level 5',
                requirement: () => this.gameState.actionStats.clicking.level >= 5,
                reward: { type: 'gold', amount: 50 }
            },
            clickingMaster: {
                id: 'clickingMaster',
                name: 'Clicking Master',
                icon: '👍',
                description: 'Reach clicking level 10',
                requirement: () => this.gameState.actionStats.clicking.level >= 10,
                reward: { type: 'gems', amount: 2 }
            },
            clickingExpert: {
                id: 'clickingExpert',
                name: 'Clicking Expert',
                icon: '🖱️',
                description: 'Reach clicking level 20',
                requirement: () => this.gameState.actionStats.clicking.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Foraging Skill Achievements
            foragingNovice: {
                id: 'foragingNovice',
                name: 'Foraging Novice',
                icon: '🌿',
                description: 'Reach foraging level 5',
                requirement: () => this.gameState.actionStats.foraging.level >= 5,
                reward: { type: 'gold', amount: 75 }
            },
            foragingMaster: {
                id: 'foragingMaster',
                name: 'Foraging Master',
                icon: '🌳',
                description: 'Reach foraging level 10',
                requirement: () => this.gameState.actionStats.foraging.level >= 10,
                reward: { type: 'gems', amount: 2 }
            },
            foragingExpert: {
                id: 'foragingExpert',
                name: 'Foraging Expert',
                icon: '🍃',
                description: 'Reach foraging level 20',
                requirement: () => this.gameState.actionStats.foraging.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Hunting Skill Achievements
            huntingNovice: {
                id: 'huntingNovice',
                name: 'Hunting Novice',
                icon: '🏹',
                description: 'Reach hunting level 5',
                requirement: () => this.gameState.actionStats.hunting.level >= 5,
                reward: { type: 'gold', amount: 100 }
            },
            huntingMaster: {
                id: 'huntingMaster',
                name: 'Hunting Master',
                icon: '🎯',
                description: 'Reach hunting level 10',
                requirement: () => this.gameState.actionStats.hunting.level >= 10,
                reward: { type: 'gems', amount: 2 }
            },
            huntingExpert: {
                id: 'huntingExpert',
                name: 'Hunting Expert',
                icon: '🦌',
                description: 'Reach hunting level 20',
                requirement: () => this.gameState.actionStats.hunting.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Mining Skill Achievements
            miningNovice: {
                id: 'miningNovice',
                name: 'Mining Novice',
                icon: '⛏️',
                description: 'Reach mining level 5',
                requirement: () => this.gameState.actionStats.mining.level >= 5,
                reward: { type: 'gold', amount: 150 }
            },
            miningMaster: {
                id: 'miningMaster',
                name: 'Mining Master',
                icon: '💎',
                description: 'Reach mining level 10',
                requirement: () => this.gameState.actionStats.mining.level >= 10,
                reward: { type: 'gems', amount: 3 }
            },
            miningExpert: {
                id: 'miningExpert',
                name: 'Mining Expert',
                icon: '⛰️',
                description: 'Reach mining level 20',
                requirement: () => this.gameState.actionStats.mining.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Questing Skill Achievements
            questingNovice: {
                id: 'questingNovice',
                name: 'Questing Novice',
                icon: '⚔️',
                description: 'Reach questing level 5',
                requirement: () => this.gameState.actionStats.questing.level >= 5,
                reward: { type: 'gold', amount: 200 }
            },
            questingMaster: {
                id: 'questingMaster',
                name: 'Questing Master',
                icon: '🛡️',
                description: 'Reach questing level 10',
                requirement: () => this.gameState.actionStats.questing.level >= 10,
                reward: { type: 'gems', amount: 3 }
            },
            questingExpert: {
                id: 'questingExpert',
                name: 'Questing Expert',
                icon: '🗡️',
                description: 'Reach questing level 20',
                requirement: () => this.gameState.actionStats.questing.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Fishing Skill Achievements
            fishingNovice: {
                id: 'fishingNovice',
                name: 'Fishing Novice',
                icon: '🎣',
                description: 'Reach fishing level 5',
                requirement: () => this.gameState.actionStats.fishing.level >= 5,
                reward: { type: 'gold', amount: 75 }
            },
            fishingMaster: {
                id: 'fishingMaster',
                name: 'Fishing Master',
                icon: '🐟',
                description: 'Reach fishing level 10',
                requirement: () => this.gameState.actionStats.fishing.level >= 10,
                reward: { type: 'gems', amount: 2 }
            },
            fishingExpert: {
                id: 'fishingExpert',
                name: 'Fishing Expert',
                icon: '🐠',
                description: 'Reach fishing level 20',
                requirement: () => this.gameState.actionStats.fishing.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Crafting Skill Achievements
            craftingNovice: {
                id: 'craftingNovice',
                name: 'Crafting Novice',
                icon: '🔨',
                description: 'Reach crafting level 5',
                requirement: () => this.gameState.actionStats.crafting.level >= 5,
                reward: { type: 'gold', amount: 125 }
            },
            craftingMaster: {
                id: 'craftingMaster',
                name: 'Crafting Master',
                icon: '🛠️',
                description: 'Reach crafting level 10',
                requirement: () => this.gameState.actionStats.crafting.level >= 10,
                reward: { type: 'gems', amount: 2 }
            },
            craftingExpert: {
                id: 'craftingExpert',
                name: 'Crafting Expert',
                icon: '⚒️',
                description: 'Reach crafting level 20',
                requirement: () => this.gameState.actionStats.crafting.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Trading Skill Achievements
            tradingNovice: {
                id: 'tradingNovice',
                name: 'Trading Novice',
                icon: '💼',
                description: 'Reach trading level 5',
                requirement: () => this.gameState.actionStats.trading.level >= 5,
                reward: { type: 'gold', amount: 175 }
            },
            tradingMaster: {
                id: 'tradingMaster',
                name: 'Trading Master',
                icon: '💹',
                description: 'Reach trading level 10',
                requirement: () => this.gameState.actionStats.trading.level >= 10,
                reward: { type: 'gems', amount: 3 }
            },
            tradingExpert: {
                id: 'tradingExpert',
                name: 'Trading Expert',
                icon: '📈',
                description: 'Reach trading level 20',
                requirement: () => this.gameState.actionStats.trading.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Exploring Skill Achievements
            exploringNovice: {
                id: 'exploringNovice',
                name: 'Exploring Novice',
                icon: '🗺️',
                description: 'Reach exploring level 5',
                requirement: () => this.gameState.actionStats.exploring.level >= 5,
                reward: { type: 'gold', amount: 200 }
            },
            exploringMaster: {
                id: 'exploringMaster',
                name: 'Exploring Master',
                icon: '🧭',
                description: 'Reach exploring level 10',
                requirement: () => this.gameState.actionStats.exploring.level >= 10,
                reward: { type: 'gems', amount: 3 }
            },
            exploringExpert: {
                id: 'exploringExpert',
                name: 'Exploring Expert',
                icon: '🌍',
                description: 'Reach exploring level 20',
                requirement: () => this.gameState.actionStats.exploring.level >= 20,
                reward: { type: 'gems', amount: 5 }
            },

            // Gold Achievements
            goldCollector: {
                id: 'goldCollector',
                name: 'Gold Collector',
                icon: '💰',
                description: 'Earn 1,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 1000,
                reward: { type: 'gold', amount: 200 }
            },
            goldMerchant: {
                id: 'goldMerchant',
                name: 'Gold Merchant',
                icon: '💵',
                description: 'Earn 10,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 10000,
                reward: { type: 'gems', amount: 3 }
            },
            goldMagnate: {
                id: 'goldMagnate',
                name: 'Gold Magnate',
                icon: '💸',
                description: 'Earn 100,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 100000,
                reward: { type: 'gems', amount: 5 }
            },
            goldTycoon: {
                id: 'goldTycoon',
                name: 'Gold Tycoon',
                icon: '🤑',
                description: 'Earn 250,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 250000,
                reward: { type: 'gems', amount: 10 }
            },
            goldBillionaire: {
                id: 'goldBillionaire',
                name: 'Gold Billionaire',
                icon: '💎',
                description: 'Earn 500,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 500000,
                reward: { type: 'gems', amount: 15 }
            },
            goldLegend: {
                id: 'goldLegend',
                name: 'Gold Legend',
                icon: '👑',
                description: 'Earn 1,000,000 total gold',
                requirement: () => this.gameState.totalGoldEarned >= 1000000,
                reward: { type: 'gems', amount: 25 }
            },

            // Action Completion Achievements
            actionAddict: {
                id: 'actionAddict',
                name: 'Action Addict',
                icon: '🔥',
                description: 'Complete 100 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 100,
                reward: { type: 'gold', amount: 300 }
            },
            actionHero: {
                id: 'actionHero',
                name: 'Action Hero',
                icon: '⚡',
                description: 'Complete 500 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 500,
                reward: { type: 'gems', amount: 3 }
            },
            actionVeteran: {
                id: 'actionVeteran',
                name: 'Action Veteran',
                icon: '💪',
                description: 'Complete 1,000 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 1000,
                reward: { type: 'gems', amount: 5 }
            },
            actionLegend: {
                id: 'actionLegend',
                name: 'Action Legend',
                icon: '💫',
                description: 'Complete 2,500 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 2500,
                reward: { type: 'gems', amount: 10 }
            },
            actionMaster: {
                id: 'actionMaster',
                name: 'Action Master',
                icon: '🌟',
                description: 'Complete 5,000 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 5000,
                reward: { type: 'gems', amount: 15 }
            },
            actionGod: {
                id: 'actionGod',
                name: 'Action God',
                icon: '✨',
                description: 'Complete 10,000 actions',
                requirement: () => this.gameState.totalActionsCompleted >= 10000,
                reward: { type: 'gems', amount: 25 }
            },

            // Click Achievements
            clickNovice: {
                id: 'clickNovice',
                name: 'Click Novice',
                icon: '👆',
                description: 'Click 100 times',
                requirement: () => this.gameState.totalClicks >= 100,
                reward: { type: 'gold', amount: 100 }
            },
            clickMaster: {
                id: 'clickMaster',
                name: 'Click Master',
                icon: '🖱️',
                description: 'Click 500 times',
                requirement: () => this.gameState.totalClicks >= 500,
                reward: { type: 'gems', amount: 2 }
            },
            clickExpert: {
                id: 'clickExpert',
                name: 'Click Expert',
                icon: '👍',
                description: 'Click 1,000 times',
                requirement: () => this.gameState.totalClicks >= 1000,
                reward: { type: 'gems', amount: 5 }
            },
            clickLegend: {
                id: 'clickLegend',
                name: 'Click Legend',
                icon: '🔥',
                description: 'Click 2,500 times',
                requirement: () => this.gameState.totalClicks >= 2500,
                reward: { type: 'gems', amount: 10 }
            },

            // Upgrade Achievements
            upgradeApprentice: {
                id: 'upgradeApprentice',
                name: 'Upgrade Apprentice',
                icon: '⬆️',
                description: 'Purchase 50 upgrades',
                requirement: () => this.gameState.totalUpgradesBought >= 50,
                reward: { type: 'gems', amount: 3 }
            },
            upgradeExpert: {
                id: 'upgradeExpert',
                name: 'Upgrade Expert',
                icon: '📈',
                description: 'Purchase 100 upgrades',
                requirement: () => this.gameState.totalUpgradesBought >= 100,
                reward: { type: 'gems', amount: 5 }
            },
            upgradeMaster: {
                id: 'upgradeMaster',
                name: 'Upgrade Master',
                icon: '🚀',
                description: 'Purchase 200 upgrades',
                requirement: () => this.gameState.totalUpgradesBought >= 200,
                reward: { type: 'gems', amount: 10 }
            },
            upgradeLegend: {
                id: 'upgradeLegend',
                name: 'Upgrade Legend',
                icon: '⭐',
                description: 'Purchase 400 upgrades',
                requirement: () => this.gameState.totalUpgradesBought >= 400,
                reward: { type: 'gems', amount: 15 }
            },

            // Gem Achievements
            gemCollector: {
                id: 'gemCollector',
                name: 'Gem Collector',
                icon: '💎',
                description: 'Collect 50 gems',
                requirement: () => this.gameState.gems >= 50,
                reward: { type: 'gems', amount: 10 }
            },
            gemHoarder: {
                id: 'gemHoarder',
                name: 'Gem Hoarder',
                icon: '💍',
                description: 'Collect 100 gems',
                requirement: () => this.gameState.gems >= 100,
                reward: { type: 'gems', amount: 15 }
            },
            gemMaster: {
                id: 'gemMaster',
                name: 'Gem Master',
                icon: '👑',
                description: 'Collect 200 gems',
                requirement: () => this.gameState.gems >= 200,
                reward: { type: 'gems', amount: 25 }
            },

            // Special Achievement
            allRounder: {
                id: 'allRounder',
                name: 'All-Rounder',
                icon: '🌟',
                description: 'Unlock all actions',
                requirement: () => this.gameState.unlockedActions.length === Object.keys(this.actions).length,
                reward: { type: 'gems', amount: 5 }
            }
        };

        this.activeActions = {};
        this.keysPressed = new Set();
        this.statisticsUpdateInterval = null;
        this.init();
    }

    init() {
        this.loadGame();
        this.applyDarkMode();
        this.renderActions();
        this.renderUpgrades();
        this.renderAchievements();
        this.renderStatistics();
        this.renderSettings();
        this.updateUI();
        this.setupEventListeners();
        this.startAutoSave();
        this.checkLevelUnlocks();
        this.checkAchievements();
        this.restoreActiveActionsFromSave();
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

        document.getElementById('achievementsTab').addEventListener('click', () => {
            this.showTab('achievements');
        });

        document.getElementById('actionsTab').addEventListener('click', () => {
            this.showTab('actions');
        });

        document.getElementById('upgradesTab').addEventListener('click', () => {
            this.showTab('upgrades');
        });

        document.getElementById('statisticsTab').addEventListener('click', () => {
            this.showTab('statistics');
            this.renderStatistics();
        });

        document.getElementById('settingsTab').addEventListener('click', () => {
            this.showTab('settings');
        });

        document.getElementById('closeCompletionBtn').addEventListener('click', () => {
            this.hideCompletionPopup();
        });

        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key.toLowerCase());
        });
    }

    handleKeyboardShortcut(e) {
        // Don't trigger if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Don't trigger if user is focused on a button (prevents double-click with space)
        if (e.target.tagName === 'BUTTON') return;

        const key = e.key.toLowerCase();

        // Prevent key repeat for space bar
        if (key === ' ') {
            if (this.keysPressed.has(' ')) return;
            this.keysPressed.add(' ');
        }

        switch(key) {
            case ' ':
                e.preventDefault();
                const clickBtn = document.getElementById('action-clicking');
                if (clickBtn && !clickBtn.disabled) {
                    clickBtn.click();
                }
                break;
            case '1':
                e.preventDefault();
                this.showTab('actions');
                break;
            case '2':
                e.preventDefault();
                this.showTab('upgrades');
                break;
            case '3':
                e.preventDefault();
                this.showTab('achievements');
                break;
            case '4':
                e.preventDefault();
                this.showTab('statistics');
                this.renderStatistics();
                break;
            case '5':
                e.preventDefault();
                this.showTab('settings');
                break;
            case 's':
                e.preventDefault();
                this.saveGame();
                this.showNotification('Game saved!');
                break;
            case 'd':
                e.preventDefault();
                this.toggleDarkMode();
                break;
        }
    }

    showTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.getElementById(`${tab}Tab`).classList.add('active');
        document.getElementById(`${tab}-section`).classList.add('active');

        // Start live updates for statistics tab
        if (tab === 'statistics') {
            this.startStatisticsLiveUpdate();
        } else {
            this.stopStatisticsLiveUpdate();
        }
    }

    startStatisticsLiveUpdate() {
        // Clear any existing interval
        this.stopStatisticsLiveUpdate();

        // Update immediately
        this.updateLiveStatistics();

        // Set up interval to update every second
        this.statisticsUpdateInterval = setInterval(() => {
            this.updateLiveStatistics();
        }, 1000);
    }

    stopStatisticsLiveUpdate() {
        if (this.statisticsUpdateInterval) {
            clearInterval(this.statisticsUpdateInterval);
            this.statisticsUpdateInterval = null;
        }
    }

    updateLiveStatistics() {
        // Update stat cards
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length > 0) {
            const stats = [
                this.gameState.totalActionsCompleted,
                this.gameState.totalClicks || 0,
                this.gameState.totalGoldEarned,
                this.gameState.totalUpgradesBought || 0,
                this.gameState.level,
                `${this.gameState.unlockedAchievements.length}/${Object.keys(this.achievements).length}`,
                `${this.gameState.unlockedActions.length}/${Object.keys(this.actions).length}`,
                `${this.gameState.maxActiveActions}`,
            ];

            statCards.forEach((card, index) => {
                const valueElement = card.querySelector('.stat-value');
                if (valueElement) {
                    valueElement.textContent = stats[index];
                }
            });
        }

        // Update action stats
        Object.values(this.actions).forEach(action => {
            const isUnlocked = this.gameState.unlockedActions.includes(action.id);
            if (!isUnlocked) return;

            const actionStats = this.gameState.actionStats[action.id];
            const actionStatCards = document.querySelectorAll('.action-stat-card');

            actionStatCards.forEach(card => {
                const nameElement = card.querySelector('.action-stat-name');
                if (nameElement && nameElement.textContent === action.name) {
                    const highlights = card.querySelectorAll('.action-stat-highlight');
                    if (highlights.length >= 3) {
                        highlights[0].textContent = actionStats.level;
                        highlights[1].textContent = actionStats.timesCompleted;
                        highlights[2].textContent = `${actionStats.xp}/${actionStats.xpNeeded} XP`;
                    }
                }
            });
        });

        // Update completion stats playtime
        const livePlaytimeElement = document.getElementById('live-playtime');
        if (livePlaytimeElement) {
            const playTime = Date.now() - this.gameState.startTime;
            const hours = Math.floor(playTime / (1000 * 60 * 60));
            const minutes = Math.floor((playTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((playTime % (1000 * 60)) / 1000);

            let playTimeText = '';
            if (hours > 0) {
                playTimeText = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                playTimeText = `${minutes}m ${seconds}s`;
            } else {
                playTimeText = `${seconds}s`;
            }
            livePlaytimeElement.textContent = playTimeText;

            // Update other completion stats
            const completionStatValues = document.querySelectorAll('.completion-stat-value');
            if (completionStatValues.length >= 6) {
                completionStatValues[1].textContent = this.gameState.level;
                completionStatValues[2].textContent = this.gameState.totalGoldEarned;
                completionStatValues[3].textContent = this.gameState.totalActionsCompleted;
                completionStatValues[4].textContent = this.gameState.totalClicks || 0;
            }
        }
    }

    renderActions() {
        const actionsContainer = document.getElementById('actions');
        actionsContainer.innerHTML = '';

        const activeIdleCount = Object.keys(this.activeActions).filter(id => this.actions[id]?.type === 'idle').length;
        const slotsDisplay = document.getElementById('active-slots-display');
        if (slotsDisplay) {
            slotsDisplay.textContent = `(${activeIdleCount}/${this.gameState.maxActiveActions} Active)`;
        }

        Object.values(this.actions).forEach(action => {
            const isUnlocked = this.gameState.unlockedActions.includes(action.id);
            const canUnlock = this.gameState.level >= action.unlockLevel;
            const actionStats = this.gameState.actionStats[action.id];
            const isActive = this.activeActions[action.id] !== undefined;

            const card = document.createElement('div');
            card.className = `action-card ${!isUnlocked && !canUnlock ? 'locked' : ''} ${isActive ? 'active' : ''}`;

            const xpReward = this.calculateReward(action, 'xp');
            const goldReward = this.calculateReward(action, 'gold');
            const actionXpReward = Math.floor(xpReward * 0.5);

            if (action.type === 'clicker') {
                const clicksNeeded = this.getClicksNeeded(action);
                const currentProgress = this.gameState.clickerProgress || 0;

                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-icon">${action.icon}</div>
                        <div>
                            <div class="card-title">${action.name}</div>
                            ${isUnlocked ? `<div class="skill-level">Skill Lv.${actionStats.level}</div>` : ''}
                        </div>
                    </div>
                    <div class="card-description">${action.description}</div>
                    ${isUnlocked ? `
                        <div class="skill-progress">
                            <div class="skill-progress-bar">
                                <div class="skill-progress-fill" style="width: ${(actionStats.xp / actionStats.xpNeeded) * 100}%"></div>
                            </div>
                            <div class="skill-progress-text">${actionStats.xp}/${actionStats.xpNeeded} XP</div>
                        </div>
                    ` : ''}
                    <div class="card-rewards">
                        <span class="reward xp">+${xpReward} XP</span>
                        <span class="reward gold">+${goldReward} Gold</span>
                        ${isUnlocked ? `<span class="reward skill">+${actionXpReward} Clicking XP</span>` : ''}
                    </div>
                    <div class="clicker-progress-bar">
                        <div class="clicker-progress-fill" id="clicker-fill-${action.id}" style="width: ${(currentProgress / clicksNeeded) * 100}%"></div>
                    </div>
                    <div class="clicker-progress-text">${currentProgress}/${clicksNeeded} Clicks</div>
                    <button class="action-btn clicker-btn" id="action-${action.id}" ${!isUnlocked ? 'disabled' : ''}>
                        ${!isUnlocked ? '🔒 Locked' : 'Click Me!'}
                    </button>
                `;
            } else {
                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-icon">${action.icon}</div>
                        <div>
                            <div class="card-title">${action.name}</div>
                            ${isUnlocked ? `<div class="skill-level">Skill Lv.${actionStats.level}</div>` : ''}
                        </div>
                        ${!isUnlocked && canUnlock ? '<span class="unlock-badge">NEW!</span>' : ''}
                    </div>
                    <div class="card-description">${action.description}</div>
                    ${isUnlocked ? `
                        <div class="skill-progress">
                            <div class="skill-progress-bar">
                                <div class="skill-progress-fill" style="width: ${(actionStats.xp / actionStats.xpNeeded) * 100}%"></div>
                            </div>
                            <div class="skill-progress-text">${actionStats.xp}/${actionStats.xpNeeded} XP</div>
                        </div>
                    ` : ''}
                    <div class="card-rewards">
                        <span class="reward xp">+${xpReward} XP</span>
                        <span class="reward gold">+${goldReward} Gold</span>
                        ${isUnlocked ? `<span class="reward skill">+${actionXpReward} ${action.name} XP</span>` : ''}
                    </div>
                    ${!isUnlocked ? `<div style="color: #ef4444; font-size: 0.85rem;">Unlocks at level ${action.unlockLevel}</div>` : ''}
                    <button class="action-btn ${isActive ? 'stop-btn' : ''}" id="action-${action.id}" ${!isUnlocked ? 'disabled' : ''}>
                        ${!isUnlocked ? '🔒 Locked' : isActive ? 'Stop' : 'Start'}
                    </button>
                    <div class="progress-bar" id="progress-${action.id}" style="display: ${isActive ? 'block' : 'none'};">
                        <div class="progress-fill" id="progress-fill-${action.id}"></div>
                    </div>
                `;
            }

            actionsContainer.appendChild(card);

            if (isUnlocked) {
                document.getElementById(`action-${action.id}`).addEventListener('click', () => {
                    if (action.type === 'clicker') {
                        this.handleClick(action);
                    } else {
                        this.toggleAction(action);
                    }
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
            const maxLevel = 30;
            const isMaxed = currentLevel >= maxLevel;

            const card = document.createElement('div');
            card.className = `upgrade-card ${!isUnlocked ? 'locked' : ''}`;

            let effectText = '';
            if (upgrade.type === 'speed') {
                if (upgrade.action === 'clicking') {
                    effectText = `-${upgrade.effect * (currentLevel + 1)} clicks needed`;
                } else {
                    effectText = `-${upgrade.effect * (currentLevel + 1)}ms duration`;
                }
            } else {
                effectText = `+${upgrade.effect * (currentLevel + 1)} ${upgrade.type}`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${upgrade.icon}</div>
                    <div class="card-title">${upgrade.name}</div>
                </div>
                <div class="card-description">${upgrade.description}</div>
                <div class="upgrade-level">Level: ${currentLevel}/${maxLevel}</div>
                <div style="margin-top: 5px; color: #10b981; font-weight: bold;">${effectText}</div>
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

    updateUpgradeButtons() {
        Object.values(this.upgradeDefinitions).forEach(upgrade => {
            const btn = document.getElementById(`upgrade-${upgrade.id}`);
            if (!btn) return;

            const currentLevel = this.gameState.upgrades[upgrade.id] || 0;
            const cost = this.calculateUpgradeCost(upgrade, currentLevel);
            const canAfford = this.gameState.gold >= cost;
            const isUnlocked = !upgrade.unlockLevel || this.gameState.level >= upgrade.unlockLevel;
            const maxLevel = 30;
            const isMaxed = currentLevel >= maxLevel;

            btn.disabled = !canAfford || !isUnlocked || isMaxed;
        });
    }

    updateActionCards() {
        Object.values(this.actions).forEach(action => {
            const isUnlocked = this.gameState.unlockedActions.includes(action.id);
            if (!isUnlocked) return;

            const actionStats = this.gameState.actionStats[action.id];

            // Update skill level text
            const card = document.getElementById(`action-${action.id}`)?.closest('.action-card');
            if (!card) return;

            const skillLevelElement = card.querySelector('.skill-level');
            if (skillLevelElement) {
                skillLevelElement.textContent = `Skill Lv.${actionStats.level}`;
            }

            // Update skill progress bar
            const skillProgressFill = card.querySelector('.skill-progress-fill');
            if (skillProgressFill) {
                const progressPercent = (actionStats.xp / actionStats.xpNeeded) * 100;
                skillProgressFill.style.width = `${progressPercent}%`;
            }

            // Update skill progress text
            const skillProgressText = card.querySelector('.skill-progress-text');
            if (skillProgressText) {
                if (action.type === 'clicker') {
                    skillProgressText.textContent = `${actionStats.xp}/${actionStats.xpNeeded} XP`;
                } else {
                    skillProgressText.textContent = `${actionStats.xp}/${actionStats.xpNeeded} XP`;
                }
            }

            // Update rewards display
            const xpReward = this.calculateReward(action, 'xp');
            const goldReward = this.calculateReward(action, 'gold');
            const actionXpReward = Math.floor(xpReward * 0.5);

            const rewardElements = card.querySelectorAll('.reward');
            if (rewardElements.length >= 3) {
                rewardElements[0].textContent = `+${xpReward} XP`;
                rewardElements[1].textContent = `+${goldReward} Gold`;
                if (action.type === 'clicker') {
                    rewardElements[2].textContent = `+${actionXpReward} Clicking XP`;
                } else {
                    rewardElements[2].textContent = `+${actionXpReward} ${action.name} XP`;
                }
            }
        });
    }

    renderAchievements() {
        const achievementsContainer = document.getElementById('achievements');
        achievementsContainer.innerHTML = '';

        // Ensure the container uses the grid styles (matches other tabs)
        achievementsContainer.classList.add('achievements-grid');

        // Define achievement categories in display order
        const categories = [
            {
                name: '🎯 First Time',
                ids: ['firstClick', 'firstStep', 'firstUpgrade']
            },
            {
                name: '⭐ Level',
                ids: ['level5', 'level10', 'level20', 'level30']
            },
            {
                name: '👆 Clicking',
                ids: ['clickingEnthusiast', 'clickingMaster', 'clickingExpert']
            },
            {
                name: '🌿 Foraging',
                ids: ['foragingNovice', 'foragingMaster', 'foragingExpert']
            },
            {
                name: '🏹 Hunting',
                ids: ['huntingNovice', 'huntingMaster', 'huntingExpert']
            },
            {
                name: '⛏️ Mining',
                ids: ['miningNovice', 'miningMaster', 'miningExpert']
            },
            {
                name: '🗡️ Questing',
                ids: ['questingNovice', 'questingMaster', 'questingExpert']
            },
            {
                name: '🎣 Fishing',
                ids: ['fishingNovice', 'fishingMaster', 'fishingExpert']
            },
            {
                name: '🔨 Crafting',
                ids: ['craftingNovice', 'craftingMaster', 'craftingExpert']
            },
            {
                name: '🤝 Trading',
                ids: ['tradingNovice', 'tradingMaster', 'tradingExpert']
            },
            {
                name: '🗺️ Exploring',
                ids: ['exploringNovice', 'exploringMaster', 'exploringExpert']
            },
            {
                name: '💰 Gold',
                ids: ['goldCollector', 'goldMerchant', 'goldMagnate', 'goldTycoon', 'goldBillionaire', 'goldLegend']
            },
            {
                name: '🎮 Actions',
                ids: ['actionAddict', 'actionHero', 'actionVeteran', 'actionLegend', 'actionMaster', 'actionGod']
            },
            {
                name: '🖱️ Clicks',
                ids: ['clickNovice', 'clickMaster', 'clickExpert', 'clickLegend']
            },
            {
                name: '⬆️ Upgrades',
                ids: ['upgradeApprentice', 'upgradeExpert', 'upgradeMaster', 'upgradeLegend']
            },
            {
                name: '💎 Gems',
                ids: ['gemCollector', 'gemHoarder', 'gemMaster']
            },
            {
                name: '🏆 Special',
                ids: ['allRounder']
            }
        ];

        categories.forEach((category) => {
            // Add category divider that spans full grid width
            const categoryDivider = document.createElement('div');
            categoryDivider.className = 'achievement-category-divider';
            categoryDivider.textContent = category.name;
            achievementsContainer.appendChild(categoryDivider);

            // Add achievement cards for this category
            category.ids.forEach(achievementId => {
                const achievement = this.achievements[achievementId];
                if (!achievement) return;

                const isUnlocked = this.gameState.unlockedAchievements.includes(achievement.id);
                const canUnlock = achievement.requirement();

                const card = document.createElement('div');
                card.className = `achievement-card ${isUnlocked ? 'unlocked' : canUnlock ? 'ready' : 'locked'}`;

                const rewardText = achievement.reward.type === 'gold'
                    ? `${achievement.reward.amount} Gold`
                    : `${achievement.reward.amount} Gems`;

                card.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-content">
                        <div class="achievement-title">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-reward">
                            ${isUnlocked ? '✅ Unlocked!' : `🎁 Reward: ${rewardText}`}
                        </div>
                    </div>
                `;

                achievementsContainer.appendChild(card);
            });
        });
    }

    renderStatistics() {
        const statsContainer = document.getElementById('statistics');
        statsContainer.innerHTML = '';

        const stats = [
            { label: 'Total Actions Completed', value: this.gameState.totalActionsCompleted, icon: '🎯' },
            { label: 'Total Clicks', value: this.gameState.totalClicks || 0, icon: '👆' },
            { label: 'Total Gold Earned', value: this.gameState.totalGoldEarned, icon: '💰' },
            { label: 'Total Upgrades Bought', value: this.gameState.totalUpgradesBought || 0, icon: '⬆️' },
            { label: 'Current Level', value: this.gameState.level, icon: '⭐' },
            { label: 'Achievements Unlocked', value: `${this.gameState.unlockedAchievements.length}/${Object.keys(this.achievements).length}`, icon: '🏆' },
            { label: 'Actions Unlocked', value: `${this.gameState.unlockedActions.length}/${Object.keys(this.actions).length}`, icon: '🔓' },
            { label: 'Active Slots', value: `${this.gameState.maxActiveActions}`, icon: '🎰' },
        ];

        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';

        stats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <div class="stat-icon">${stat.icon}</div>
                <div class="stat-content">
                    <div class="stat-label">${stat.label}</div>
                    <div class="stat-value">${stat.value}</div>
                </div>
            `;
            statsGrid.appendChild(statCard);
        });

        statsContainer.appendChild(statsGrid);

        const actionStatsTitle = document.createElement('h3');
        actionStatsTitle.textContent = 'Action Statistics';
        actionStatsTitle.style.marginTop = '30px';
        actionStatsTitle.style.marginBottom = '15px';
        actionStatsTitle.style.color = '#667eea';
        statsContainer.appendChild(actionStatsTitle);

        const actionStatsGrid = document.createElement('div');
        actionStatsGrid.className = 'action-stats-grid';

        Object.values(this.actions).forEach(action => {
            const actionStats = this.gameState.actionStats[action.id];
            const isUnlocked = this.gameState.unlockedActions.includes(action.id);

            if (isUnlocked) {
                const actionStatCard = document.createElement('div');
                actionStatCard.className = 'action-stat-card';
                actionStatCard.innerHTML = `
                    <div class="action-stat-header">
                        <span class="action-stat-icon">${action.icon}</span>
                        <span class="action-stat-name">${action.name}</span>
                    </div>
                    <div class="action-stat-details">
                        <div class="action-stat-row">
                            <span>Level:</span>
                            <span class="action-stat-highlight">${actionStats.level}</span>
                        </div>
                        <div class="action-stat-row">
                            <span>Times Completed:</span>
                            <span class="action-stat-highlight">${actionStats.timesCompleted}</span>
                        </div>
                        <div class="action-stat-row">
                            <span>Progress:</span>
                            <span class="action-stat-highlight">${actionStats.xp}/${actionStats.xpNeeded} XP</span>
                        </div>
                    </div>
                `;
                actionStatsGrid.appendChild(actionStatCard);
            }
        });

        statsContainer.appendChild(actionStatsGrid);

        // Add completion stats if all achievements are unlocked
        if (this.gameState.unlockedAchievements.length === Object.keys(this.achievements).length) {
            const completionTitle = document.createElement('h3');
            completionTitle.textContent = '🎉 Game Completion Stats';
            completionTitle.style.marginTop = '30px';
            completionTitle.style.marginBottom = '15px';
            completionTitle.style.color = '#667eea';
            statsContainer.appendChild(completionTitle);

            const playTime = Date.now() - this.gameState.startTime;
            const hours = Math.floor(playTime / (1000 * 60 * 60));
            const minutes = Math.floor((playTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((playTime % (1000 * 60)) / 1000);

            let playTimeText = '';
            if (hours > 0) {
                playTimeText = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                playTimeText = `${minutes}m ${seconds}s`;
            } else {
                playTimeText = `${seconds}s`;
            }

            const completionCard = document.createElement('div');
            completionCard.className = 'completion-stats-card';
            completionCard.innerHTML = `
                <div class="completion-stats-header">
                    <span class="completion-stats-icon">🏆</span>
                    <span class="completion-stats-title">Congratulations! All Achievements Completed!</span>
                </div>
                <div class="completion-stats-grid">
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Playtime:</span>
                        <span class="completion-stat-value" id="live-playtime">${playTimeText}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Final Level:</span>
                        <span class="completion-stat-value">${this.gameState.level}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Total Gold Earned:</span>
                        <span class="completion-stat-value">${this.gameState.totalGoldEarned}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Total Actions:</span>
                        <span class="completion-stat-value">${this.gameState.totalActionsCompleted}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Total Clicks:</span>
                        <span class="completion-stat-value">${this.gameState.totalClicks || 0}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">Achievements:</span>
                        <span class="completion-stat-value">${this.gameState.unlockedAchievements.length}/${Object.keys(this.achievements).length}</span>
                    </div>
                </div>
            `;
            statsContainer.appendChild(completionCard);
        }
    }

    renderSettings() {
        const settingsContainer = document.getElementById('settings');
        settingsContainer.innerHTML = '';

        const settingsCard = document.createElement('div');
        settingsCard.className = 'settings-card';
        settingsCard.innerHTML = `
            <h3>Game Settings</h3>
            <div class="settings-section">
                <h4>⌨️ Keyboard Shortcuts</h4>
                <div class="keyboard-shortcuts">
                    <div class="shortcut-item"><kbd>Space</kbd> Click action</div>
                    <div class="shortcut-item"><kbd>1-5</kbd> Switch tabs</div>
                    <div class="shortcut-item"><kbd>S</kbd> Save game</div>
                    <div class="shortcut-item"><kbd>D</kbd> Toggle dark mode</div>
                </div>
            </div>
            <div class="settings-section">
                <h4>💾 Save Management</h4>
                <button id="exportSaveBtn" class="settings-btn">📤 Export Save</button>
                <button id="importSaveBtn" class="settings-btn">📥 Import Save</button>
                <input type="file" id="importFileInput" style="display: none;" accept=".json">
            </div>
            <div class="settings-section">
                <h4>⚠️ Danger Zone</h4>
                <button id="resetGameBtn" class="settings-btn danger-btn">🔄 Reset Game</button>
                <p class="settings-warning">This will delete all progress. This cannot be undone!</p>
            </div>
        `;

        settingsContainer.appendChild(settingsCard);

        document.getElementById('exportSaveBtn').addEventListener('click', () => {
            this.exportSave();
        });

        document.getElementById('importSaveBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importSave(e);
        });

        document.getElementById('resetGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your game? This cannot be undone!')) {
                localStorage.removeItem('idleGameSave');
                location.reload();
            }
        });
    }

    exportSave() {
        const saveData = JSON.stringify(this.gameState, null, 2);
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adventure-idle-save-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Save exported successfully!');
    }

    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target.result);
                this.gameState = { ...this.gameState, ...importedState };
                this.saveGame();
                location.reload();
            } catch (error) {
                alert('Invalid save file!');
            }
        };
        reader.readAsText(file);
    }

    calculateReward(action, type) {
        const base = type === 'xp' ? action.baseXP : action.baseGold;
        const upgradeKey = `${action.id}${type === 'xp' ? 'Power' : 'Gold'}`;
        const upgradeLevel = this.gameState.upgrades[upgradeKey] || 0;
        const upgrade = this.upgradeDefinitions[upgradeKey];

        if (!upgrade) return base;

        const upgradeBonus = upgrade.effect * upgradeLevel;
        const skillLevel = this.gameState.actionStats[action.id]?.level || 1;
        const skillBonus = Math.floor(base * (skillLevel - 1) * 0.1);

        return base + upgradeBonus + skillBonus;
    }

    calculateDuration(action) {
        const speedUpgradeKey = `${action.id}Speed`;
        const upgradeLevel = this.gameState.upgrades[speedUpgradeKey] || 0;
        const upgrade = this.upgradeDefinitions[speedUpgradeKey];

        if (!upgrade) return action.duration;

        const reduction = upgrade.effect * upgradeLevel;
        return Math.max(action.duration - reduction, 500);
    }

    calculateUpgradeCost(upgrade, currentLevel) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    getClicksNeeded(action) {
        const skillLevel = this.gameState.actionStats[action.id]?.level || 1;
        const baseClicks = Math.floor(action.clicksNeeded * Math.pow(1.1, skillLevel - 1));

        const speedUpgradeKey = `${action.id}Speed`;
        const upgradeLevel = this.gameState.upgrades[speedUpgradeKey] || 0;
        const upgrade = this.upgradeDefinitions[speedUpgradeKey];

        if (!upgrade) return baseClicks;

        const reduction = upgrade.effect * upgradeLevel;
        return Math.max(baseClicks - reduction, 3);
    }

    handleClick(action) {
        const clicksNeeded = this.getClicksNeeded(action);
        this.gameState.clickerProgress = (this.gameState.clickerProgress || 0) + 1;
        this.gameState.totalClicks = (this.gameState.totalClicks || 0) + 1;

        const progressFill = document.getElementById(`clicker-fill-${action.id}`);
        const progressText = document.querySelector('.clicker-progress-text');

        if (progressFill) {
            progressFill.style.width = `${(this.gameState.clickerProgress / clicksNeeded) * 100}%`;
        }
        if (progressText) {
            progressText.textContent = `${this.gameState.clickerProgress}/${clicksNeeded} clicks`;
        }

        if (this.gameState.clickerProgress >= clicksNeeded) {
            this.gameState.clickerProgress = 0;
            this.completeAction(action);
        }
    }

    toggleAction(action) {
        if (this.activeActions[action.id]) {
            this.stopAction(action);
        } else {
            this.startAction(action);
        }
    }

    startAction(action) {
        const activeIdleCount = Object.keys(this.activeActions).filter(id => this.actions[id]?.type === 'idle').length;

        if (activeIdleCount >= this.gameState.maxActiveActions) {
            this.showNotification('Maximum active actions reached! Stop an action or unlock more slots.');
            return;
        }

        if (this.activeActions[action.id]) return;

        const duration = this.calculateDuration(action);
        const startTime = Date.now();
        const endTime = startTime + duration;

        this.activeActions[action.id] = {
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            interval: setInterval(() => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = (elapsed / duration) * 100;

                const progressFill = document.getElementById(`progress-fill-${action.id}`);
                if (progressFill) {
                    progressFill.style.width = `${Math.min(progress, 100)}%`;
                }

                if (progress >= 100) {
                    if (progressFill) {
                        progressFill.style.width = '100%';
                    }
                    this.completeAction(action);
                }
            }, 16)
        };

        const activeActionsCopy = { ...this.activeActions };
        this.renderActions();
        this.restoreActiveActions(activeActionsCopy);
    }

    stopAction(action) {
        if (this.activeActions[action.id]) {
            clearInterval(this.activeActions[action.id].interval);
            delete this.activeActions[action.id];

            const activeActionsCopy = { ...this.activeActions };
            this.renderActions();
            this.restoreActiveActions(activeActionsCopy);
        }
    }

    completeAction(action) {
        const xpGained = this.calculateReward(action, 'xp');
        const goldGained = this.calculateReward(action, 'gold');
        const actionXpGained = Math.floor(xpGained * 0.5);

        this.gameState.xp += xpGained;
        this.gameState.gold += goldGained;
        this.gameState.totalGoldEarned += goldGained;
        this.gameState.totalActionsCompleted += 1;

        const actionStats = this.gameState.actionStats[action.id];
        actionStats.timesCompleted += 1;
        actionStats.xp += actionXpGained;

        while (actionStats.xp >= actionStats.xpNeeded) {
            actionStats.xp -= actionStats.xpNeeded;
            actionStats.level += 1;
            actionStats.xpNeeded = Math.floor(actionStats.xpNeeded * 1.3);
            this.showNotification(`${action.icon} ${action.name} leveled up to ${actionStats.level}!`, true);
        }

        this.checkLevelUp();
        this.checkAchievements();
        this.updateUI();
        this.updateUpgradeButtons();
        this.updateActionCards();

        if (action.type === 'idle' && this.activeActions[action.id]) {
            clearInterval(this.activeActions[action.id].interval);

            const progressFill = document.getElementById(`progress-fill-${action.id}`);
            if (progressFill) {
                progressFill.style.width = '0%';
            }

            const duration = this.calculateDuration(action);
            const startTime = Date.now();
            const endTime = startTime + duration;

            this.activeActions[action.id] = {
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                interval: setInterval(() => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = (elapsed / duration) * 100;

                    const progressFill = document.getElementById(`progress-fill-${action.id}`);
                    if (progressFill) {
                        progressFill.style.width = `${Math.min(progress, 100)}%`;
                    }

                    if (progress >= 100) {
                        if (progressFill) {
                            progressFill.style.width = '100%';
                        }
                        this.completeAction(action);
                    }
                }, 16)
            };
        } else if (action.type === 'clicker') {
            // For clicker actions, just update the clicker card without re-rendering everything
            const clicksNeeded = this.getClicksNeeded(action);
            const progressFill = document.getElementById(`clicker-fill-${action.id}`);
            const progressText = document.querySelector('.clicker-progress-text');

            if (progressFill) {
                progressFill.style.width = '0%';
            }
            if (progressText) {
                progressText.textContent = `0/${clicksNeeded} clicks`;
            }
        }
    }

    checkLevelUp() {
        while (this.gameState.xp >= this.gameState.xpNeeded) {
            this.gameState.xp -= this.gameState.xpNeeded;
            this.gameState.level++;
            this.gameState.xpNeeded = Math.floor(this.gameState.xpNeeded * 1.4);

            this.showNotification(`🎉 Level Up! You are now level ${this.gameState.level}!`, true);
            this.checkLevelUnlocks();
        }
    }

    checkLevelUnlocks() {
        let unlocked = false;
        let slotsUnlocked = false;

        const slotUnlockLevels = [1, 5, 10, 15, 20, 25];
        const targetSlots = slotUnlockLevels.filter(lvl => lvl <= this.gameState.level).length;

        if (targetSlots > this.gameState.maxActiveActions) {
            this.gameState.maxActiveActions = targetSlots;
            this.showNotification(`🎁 New action slot unlocked! You can now run ${targetSlots} actions simultaneously!`, true);
            slotsUnlocked = true;
        }

        Object.values(this.actions).forEach(action => {
            if (this.gameState.level >= action.unlockLevel &&
                !this.gameState.unlockedActions.includes(action.id)) {
                this.gameState.unlockedActions.push(action.id);
                this.showNotification(`🎊 New action unlocked: ${action.name}!`);
                unlocked = true;
            }
        });

        if (unlocked || slotsUnlocked) {
            const activeActionsCopy = { ...this.activeActions };
            this.renderActions();
            this.renderUpgrades();
            this.restoreActiveActions(activeActionsCopy);
        }
    }

    checkAchievements() {
        let newlyUnlocked = false;

        Object.values(this.achievements).forEach(achievement => {
            if (!this.gameState.unlockedAchievements.includes(achievement.id) &&
                achievement.requirement()) {
                this.gameState.unlockedAchievements.push(achievement.id);
                newlyUnlocked = true;

                if (achievement.reward.type === 'gold') {
                    this.gameState.gold += achievement.reward.amount;
                } else if (achievement.reward.type === 'gems') {
                    this.gameState.gems += achievement.reward.amount;
                }

                const rewardText = achievement.reward.type === 'gold'
                    ? `${achievement.reward.amount} Gold`
                    : `${achievement.reward.amount} Gems`;

                this.showNotification(`🏆 Achievement Unlocked: ${achievement.name}! (+${rewardText})`, true);
                this.renderAchievements();
                this.updateUI();
            }
        });

        if (newlyUnlocked && this.gameState.unlockedAchievements.length === Object.keys(this.achievements).length) {
            if (!this.gameState.completionPopupShown) {
                this.gameState.completionPopupShown = true;
                setTimeout(() => this.showCompletionPopup(), 2000);
            }
        }
    }

    restoreActiveActions(activeActionsCopy) {
        Object.keys(activeActionsCopy).forEach(actionId => {
            const action = this.actions[actionId];
            if (!action) return;

            if (action.type === 'idle') {
                const progressBar = document.getElementById(`progress-${actionId}`);
                if (progressBar) {
                    progressBar.style.display = 'block';
                }
            }
        });
    }

    restoreActiveActionsFromSave() {
        if (!this.gameState.activeActionIds || this.gameState.activeActionIds.length === 0) {
            return;
        }

        this.gameState.activeActionIds.forEach(actionId => {
            const action = this.actions[actionId];
            if (action && action.type === 'idle' && this.gameState.unlockedActions.includes(actionId)) {
                this.startAction(action);
            }
        });
    }

    purchaseUpgrade(upgrade) {
        const currentLevel = this.gameState.upgrades[upgrade.id] || 0;
        const cost = this.calculateUpgradeCost(upgrade, currentLevel);

        if (this.gameState.gold >= cost) {
            this.gameState.gold -= cost;
            this.gameState.upgrades[upgrade.id] = currentLevel + 1;
            this.gameState.totalUpgradesBought = (this.gameState.totalUpgradesBought || 0) + 1;
            this.checkAchievements();
            this.updateUI();

            const activeActionsCopy = { ...this.activeActions };
            this.renderActions();
            this.renderUpgrades();
            this.restoreActiveActions(activeActionsCopy);

            this.showNotification(`⬆️ Upgraded ${upgrade.name}!`);
        }
    }

    updateUI() {
        document.getElementById('level').textContent = this.gameState.level;
        document.getElementById('xp').textContent = Math.floor(this.gameState.xp);
        document.getElementById('xpNeeded').textContent = this.gameState.xpNeeded;
        document.getElementById('gold').textContent = Math.floor(this.gameState.gold);
        document.getElementById('gems').textContent = this.gameState.gems;

        const achievementCount = this.gameState.unlockedAchievements.length;
        // Prefer counting rendered achievement cards so the UI counter matches what's shown
        let totalAchievements = Object.keys(this.achievements).length;
        const achievementsContainer = document.getElementById('achievements');
        if (achievementsContainer) {
            const renderedCards = achievementsContainer.querySelectorAll('.achievement-card').length;
            // If cards were rendered, use that as the authoritative total (fallback to object keys)
            if (renderedCards > 0) totalAchievements = renderedCards;
        }
        document.getElementById('achievementCount').textContent = `${achievementCount}/${totalAchievements}`;

        // Debug helper: log any achievements whose requirement is met but not present in unlockedAchievements
        try {
            const missingButEligible = Object.values(this.achievements).filter(a => {
                try { return a && a.requirement && a.requirement() && !this.gameState.unlockedAchievements.includes(a.id); } catch (e) { return false; }
            }).map(a => a.id);
            if (missingButEligible.length) {
                console.debug('Achievements eligible but not unlocked (IDs):', missingButEligible);
            }
        } catch (e) {
            // ignore
        }

        if (this.gameState.level >= 30 && !this.gameState.maxLevelNotificationShown) {
            this.gameState.maxLevelNotificationShown = true;
            this.showNotification('🏆 Congratulations! You\'ve mastered the game! Keep playing to max out all skills and achievements!', true);
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
        this.gameState.activeActionIds = Object.keys(this.activeActions);
        localStorage.setItem('idleGameSave', JSON.stringify(this.gameState));
    }

    loadGame() {
        const saved = localStorage.getItem('idleGameSave');
        if (saved) {
            const loadedState = JSON.parse(saved);
            this.gameState = { ...this.gameState, ...loadedState };

            if (!this.gameState.maxActiveActions) {
                this.gameState.maxActiveActions = 1;
            }
            if (!this.gameState.clickerProgress) {
                this.gameState.clickerProgress = 0;
            }
            if (!this.gameState.activeActionIds) {
                this.gameState.activeActionIds = [];
            }
            if (!this.gameState.startTime) {
                this.gameState.startTime = Date.now();
            }

            Object.keys(this.actions).forEach(actionId => {
                if (!this.gameState.actionStats[actionId]) {
                    this.gameState.actionStats[actionId] = {
                        level: 1,
                        xp: 0,
                        xpNeeded: actionId === 'clicking' ? 30 : 50,
                        timesCompleted: 0
                    };
                }
            });

            // Repair/initialize totalUpgradesBought from saved upgrades object
            try {
                const upgradesObj = this.gameState.upgrades || {};
                const computedTotalUpgrades = Object.values(upgradesObj).reduce((sum, v) => sum + (Number(v) || 0), 0);
                // If the saved total is missing or less than the computed sum, update it
                if (!this.gameState.totalUpgradesBought || this.gameState.totalUpgradesBought < computedTotalUpgrades) {
                    this.gameState.totalUpgradesBought = computedTotalUpgrades;
                }
            } catch (e) {
                // If anything goes wrong, ensure the field exists
                this.gameState.totalUpgradesBought = this.gameState.totalUpgradesBought || 0;
            }
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, 10000);
    }

    showCompletionPopup() {
        const popup = document.getElementById('completionPopup');
        const statsContainer = document.getElementById('completionStats');

        const playTime = Date.now() - this.gameState.startTime;
        const hours = Math.floor(playTime / (1000 * 60 * 60));
        const minutes = Math.floor((playTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((playTime % (1000 * 60)) / 1000);

        let playTimeText = '';
        if (hours > 0) {
            playTimeText = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            playTimeText = `${minutes}m ${seconds}s`;
        } else {
            playTimeText = `${seconds}s`;
        }

        statsContainer.innerHTML = `
            <div><strong>Playtime:</strong> ${playTimeText}</div>
            <div><strong>Final Level:</strong> ${this.gameState.level}</div>
            <div><strong>Total Gold Earned:</strong> ${this.gameState.totalGoldEarned}</div>
            <div><strong>Total Actions Completed:</strong> ${this.gameState.totalActionsCompleted}</div>
            <div><strong>Total Clicks:</strong> ${this.gameState.totalClicks}</div>
            <div><strong>Achievements:</strong> ${this.gameState.unlockedAchievements.length}/${Object.keys(this.achievements).length}</div>
        `;

        popup.classList.add('show');
    }

    hideCompletionPopup() {
        const popup = document.getElementById('completionPopup');
        popup.classList.remove('show');
    }

    toggleDarkMode() {
        this.gameState.darkMode = !this.gameState.darkMode;
        this.applyDarkMode();
        this.saveGame();
    }

    applyDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        if (this.gameState.darkMode) {
            document.body.classList.add('dark-mode');
            toggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            toggle.textContent = '🌙';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IdleGame();
});
