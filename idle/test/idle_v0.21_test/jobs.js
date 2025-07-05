// jobs.js — handles job logic only (used by idlegame.js)
// Gear required for combat jobs
window.hasRequiredGear = function(jobId, resources) {
  const job = window.gameData.jobs[jobId];
  if (!job || job.job_type !== "combat") return true;

  const required = job.required_gear;
  if (!required || required === "none") return true;

  const requiredItems = required.split(",").map(s => s.trim());

  return requiredItems.every(req => {
    const [requiredTier, part] = req.split("_");

    const requiredTierValue = window.gameData.gear[requiredTier]?.[part]?.tier || 0;

    // Look through all available gear of this part
    for (const [tierName, gearSet] of Object.entries(window.gameData.gear)) {
      const ownedItem = `${tierName}_${part}`;
      const ownedTierValue = gearSet[part]?.tier || 0;

      if ((resources[ownedItem] || 0) > 0 && ownedTierValue >= requiredTierValue) {
        return true; // Player owns valid or better gear
      }
    }

    return false; // No suitable gear found
  });
};

// This file contains logic for assigning tools and gear to jobs, and applying job ticks
window.getBestToolForJob = function(jobId) {
  const priorities = [];

  for (const [tierName, tools] of Object.entries(window.gameData.tools)) {
    for (const [toolName, data] of Object.entries(tools)) {
      if (data.used_for === jobId) {
        const itemId = `${tierName}_${toolName}`;
        let slot = priorities.find(p => p.includes(itemId));
        if (!slot) priorities.push([itemId]);  // wrap in array
      }
    }
  }

  // Sort descending by tier value (higher tier first)
  priorities.forEach(slot => {
    slot.sort((a, b) => {
      const tierA = window.gameData.tools[a.split('_')[0]]?.[a.split('_')[1]]?.tier || 0;
      const tierB = window.gameData.tools[b.split('_')[0]]?.[b.split('_')[1]]?.tier || 0;
      return tierB - tierA;
    });
  });

  return priorities;
};

// Get the best gear for a job, sorted by tier and part
window.getBestGearForJob = function(jobId) {
  const job = window.gameData.jobs[jobId];
    if (!job) return [];

    const priorities = [];

    // Define required gear parts used in fighting (always try equip if available)
    const requiredParts = ["sword", "armor", "shield"];

  for (const part of requiredParts) {
    const matching = [];

    for (const [tierName, gearSet] of Object.entries(window.gameData.gear)) {
      if (gearSet[part]) {
        matching.push(`${tierName}_${part}`);
      }
    }

    // Sort descending by tier
    matching.sort((a, b) => {
      const [tierA] = a.split("_");
      const [tierB] = b.split("_");
      const valA = window.gameData.gear[tierA]?.[part]?.tier || 0;
      const valB = window.gameData.gear[tierB]?.[part]?.tier || 0;
      return valB - valA;
    });

    priorities.push(matching);
  }

  return priorities;
};

// Get the best gear for a job
// TODO: Optimize tool/gear assignment by caching per worker to avoid re-evaluating on every tick.
window.assignTools = function(jobId, count, resources, toolsInUse) {
  const toolSets = getBestToolForJob(jobId, resources);
  const job = window.gameData.jobs[jobId];
  const gearSets = job?.job_type === "combat" ? getBestGearForJob(jobId, resources) : [];
  const availableItems = { ...resources };
    Object.keys(toolsInUse).forEach(k => {
    availableItems[k] = (availableItems[k] || 0) - toolsInUse[k];
  });

  const assignedSets = [];

  for (let i = 0; i < count; i++) {
    const allEquipped = [];

    // Equip best tools for this worker
    for (const slotOptions of toolSets) {
      let found = null;
      for (const tool of slotOptions) {
        const available = availableItems[tool] || 0;
        if (available > 0) {
          toolsInUse[tool] = (toolsInUse[tool] || 0) + 1;
          found = tool;
          break;
        }
      }
      allEquipped.push(found);
    }

    // Equip required gear (sword, armor, shield)
    for (const gearSlot of gearSets) {
      let found = null;
      for (const gear of gearSlot) {
        const available = availableItems[gear] || 0;
        if (available > 0) {
          toolsInUse[gear] = (toolsInUse[gear] || 0) + 1;
          found = gear;
          break;
        }
      }
      allEquipped.push(found);
    }
    // console.log(`🛡️  Gear equipped for ${jobId}:`, allEquipped);

    assignedSets.push(allEquipped);
  }

  return assignedSets;
};


window.applyJobTick = function(assignments, tasks, jobs, resources, toolsInUse) {
  Object.keys(toolsInUse).forEach(tool => toolsInUse[tool] = 0);
  for (const task of tasks) {
    const taskId = task.id;
    const assigned = assignments[taskId] || 0;
    if (assigned <= 0) continue;
    const job = jobs[taskId];
    if (!job) continue;

    const toolSetsUsed = assignTools(taskId, assigned, resources, toolsInUse);
    for (let i = 0; i < assigned; i++) {
      if (job.food_cost && (resources["cooked_fish"] || 0) < job.food_cost) continue;
      let hasRequired = true;
      if (job.required_resources) {
        for (const [res, amt] of Object.entries(job.required_resources)) {
          if ((resources[res] || 0) < amt) {
            hasRequired = false;
            break;
          }
        }
        if (!hasRequired) continue;
      }
      if (job.food_cost) resources["cooked_fish"] -= job.food_cost;
      if (job.required_resources) {
        for (const [res, amt] of Object.entries(job.required_resources)) {
          resources[res] -= amt;
        }
      }
      const toolSet = toolSetsUsed[i];
      const equippedCount = toolSet.filter(t => t !== null).length;
      const rewardMultiplier = 1.0 + equippedCount * 0.1;
      if (job.produces) {
        for (const [res, value] of Object.entries(job.produces)) {
          if (typeof value === "object" && value.chance) {
            if (Math.random() < value.chance) {
              resources[res] = (resources[res] || 0) + 1;
            }
          } else {
            resources[res] = (resources[res] || 0) + value;
          }
        }
      }
      if (job.gp_reward) {
        resources.gold += job.gp_reward;
      }
    }
  }
};