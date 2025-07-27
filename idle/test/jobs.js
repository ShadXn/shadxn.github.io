// jobs.js — handles job logic only (used by idlegame.js)
// setup gobal call for job logic
window.Jobs = window.Jobs || {};

// Gear required for combat jobs
Jobs.checkRequiredEquipment = function(jobId) {
  const job = GameState.jobs[jobId];
  if (!job) return false;

  // ✅ No gear required
  if (job.required_gear === "none" || !job.required_gear) return true;

  const requiredItems = job.required_gear.split(",").map(s => s.trim());

  return requiredItems.every(req => {
    const [tier, part] = req.split("_");
    const requiredTierValue = GameState.tiers[tier] || 0;

    for (const [tierName, gearSet] of Object.entries(GameState.gear)) {
      if (!gearSet[part]) continue;
      const key = `${tierName}_${part}`;
      const has = (GameState.resources[key] || 0) > 0;
      const tierValue = GameState.tiers[tierName] || 0;

      if (has && tierValue >= requiredTierValue) return true;
    }

    return false; // No valid match
  });
};

// Check if all required resources are available for a job
Jobs.checkRequiredResources = function(jobId) {
  const job = GameState.jobs[jobId];
  if (!job || !job.required_resources) return true; // No resources needed

  return Object.entries(job.required_resources).every(([key, amount]) => {
    return (GameState.resources[key] || 0) >= amount;
  });
};

// Get the best gear for the combat job
Jobs.getBestGear = function(jobId) {
  const job = GameState.jobs[jobId];
  if (!job) return [];

  const gearSet = [];
  const requiredParts = ["sword", "armor", "shield"];

  for (const part of requiredParts) {
    let best = null;
    let bestTier = -1;

    for (const [tierName, gearPieces] of Object.entries(GameState.gear)) {
      if (!gearPieces[part]) continue;

      const key = `${tierName}_${part}`;
      if ((GameState.resources[key] || 0) <= 0) continue;

      const tierValue = GameState.tiers[tierName] || 0;
      if (tierValue > bestTier) {
        best = key;
        bestTier = tierValue;
      }
    }

    gearSet.push(best); // can be null if none owned
  }

  return gearSet;
};

// Get the best available tool for a given tool part (e.g., "axe", "rod", etc.)
Jobs.getBestTool = function(partName) {
  let best = null;
  let bestTier = -1;

  for (const [tierName, toolSet] of Object.entries(GameState.tools)) {
    if (!toolSet[partName]) continue; // Skip if tool part doesn't exist in tier

    const key = `${tierName}_${partName}`;
    const owned = GameState.resources[key] || 0;
    if (owned <= 0) continue;

    const tierValue = GameState.tiers[tierName] || 0;
    if (tierValue > bestTier) {
      best = key;
      bestTier = tierValue;
    }
  }

  return best; // May be null if no tool found
};

// Remove all equipment from a worker when unassigning a job
Jobs.removeEquipment = function(workerId) {
  const equipped = GameState.workerData[workerId]?.equipped || [];

  for (const item of equipped) {
    if (!item) continue;
    GameState.resources[item] = (GameState.resources[item] || 0) + 1; // give back the item
  }

  if (GameState.workerData[workerId]) {
    GameState.workerData[workerId].equipped = [];
    delete GameState.workerData[workerId].jobId;
  }
};

// Assign a worker to a job
Jobs.assignWorkerToJob = function(workerId, jobId) {
  const job = GameState.jobs[jobId];
  if (!workerId || !job) return false;

  if (!GameState.workerData[workerId]) {
    GameState.initializeWorkerData(workerId); // Ensure data exists
  }

  const worker = GameState.workerData[workerId];
  const gearSlots = ["sword", "armor", "shield"];
  const gear = {};
  const tools = {};

  // ✅ Equip Gear (for combat jobs with required gear)
  if (job.job_type === "combat" && job.required_gear && job.required_gear !== "none") {
    const bestGear = Jobs.getBestGear(jobId);
    for (let i = 0; i < gearSlots.length; i++) {
      const part = gearSlots[i];
      const item = bestGear[i];
      if (!item || (GameState.resources[item] || 0) <= 0) {
        showToast(`❌ Missing ${part} for this job.`);
        return false;
      }
      GameState.resources[item]--;
      gear[part] = item;
    }
  }

  // Equip Tool (for skilling jobs that require tools)
  if (job.job_type === "skilling" && job.required_tool && job.required_tool !== "none") {
    const bestTool = Jobs.getBestTool(job.required_tool);
    if (!bestTool || (GameState.resources[bestTool] || 0) <= 0) {
      showToast(`❌ Missing required tool for this job.`);
      return false;
    }

    const toolPart = bestTool.split("_")[1]; // e.g. bronze_pickaxe → pickaxe
    tools[toolPart] = bestTool;
    GameState.resources[bestTool]--;
  }

  // Equip additional enhancement gear or tool from job_equipment
  if (job.job_equipment) {
    const parts = job.job_equipment.split(",").map(p => p.trim());

    console.log("Job equipment parts:", parts);
    for (const part of parts) {
      if (job.job_type === "skilling") {
        if (tools[part]) continue; // Already equipped
        console.log("Checking tool for part:", part);
        const bestTool = Jobs.getBestTool(part);
        console.log("Best tool for part:", part, "is", bestTool);
        if (bestTool && (GameState.resources[bestTool] || 0) > 0) {
          console.log("Equipping tool:", bestTool);
          tools[part] = bestTool;
          GameState.resources[bestTool]--;
        }

      } else if (job.job_type === "combat") {
        if (gear[part]) continue; // Already equipped
        const bestGearSet = Jobs.getBestGear(jobId);
        const match = bestGearSet.find(g => g?.endsWith(`_${part}`));
        if (match && (GameState.resources[match] || 0) > 0) {
          gear[part] = match;
          GameState.resources[match]--;
        }
      }
    }
  }



  // ✅ Update worker data
  worker.jobId = jobId;
  worker.assign_to = jobId;
  worker.timer = job.job_action_time || 1;
  worker.gear = gear;
  worker.tools = tools;

  // ✅ Mark first worker on this job
  GameState.jobTimers = GameState.jobTimers || {};
  if (!GameState.jobTimers[jobId]) {
    GameState.jobTimers[jobId] = { firstWorker: workerId };
  }

  GameState.assignments[jobId] = (GameState.assignments[jobId] || 0) + 1;
  GameState.saveProgress();
  return true;
};


// Unassign a worker from a job
Jobs.unassignWorkerFromJob = function(workerId) {
  const worker = GameState.workerData[workerId];
  if (!worker || !worker.jobId) return false;

  const jobId = worker.jobId;

  // Return gear
  for (const slot of Object.keys(worker.gear || {})) {
    const item = worker.gear[slot];
    if (item) {
      GameState.resources[item] = (GameState.resources[item] || 0) + 1;
      worker.gear[slot] = null;
    }
  }

  // Return tools
  for (const slot of Object.keys(worker.tools || {})) {
    const item = worker.tools[slot];
    if (item) {
      GameState.resources[item] = (GameState.resources[item] || 0) + 1;
      worker.tools[slot] = null;
    }
  }

  // Clear assignment
  worker.jobId = null;
  worker.assign_to = null;
  worker.timer = 0;

  // Decrease assignment count
  GameState.assignments[jobId] = Math.max(0, (GameState.assignments[jobId] || 1) - 1);

  // Handle firstWorker reassignment
  if (GameState.jobTimers?.[jobId]?.firstWorker === workerId) {
    const newFirst = GameState.ownedWorkers.find(wid =>
      GameState.workerData[wid]?.jobId === jobId && wid !== workerId
    );

    if (newFirst) {
      GameState.jobTimers[jobId].firstWorker = newFirst;
    } else {
      delete GameState.jobTimers[jobId]; // No workers left
    }
  }

  GameState.saveProgress();
  return true;
};

// Apply job logic for all workers
Jobs.applyJobTick = function(tasks) {
  for (const workerId of GameState.ownedWorkers) {
    const worker = GameState.workerData[workerId];
    if (!worker || !worker.jobId) continue;

    // Ensure jobId is set correctly
    const jobId = worker.jobId; // ✅ FIXED
    const job = GameState.jobs[worker.jobId];
    if (!job) continue;

    // Job timer, this is removed from the job timer every tick
    const tickRate = 0.5;  // or any float value like 0.25 for slower ticks

    // Check if worker has required resources for the job
    if (!Jobs.checkRequiredResources(jobId)) continue;

    // Remove a tick from the timer if the worker meets the resources and gear requirements
    worker.timer -= tickRate;
    if (worker.timer > 0) {
      updateWorkerProgressBar(workerId, jobId, worker.timer, job.job_action_time);
      continue;
    }

    // Job complete and resources consumed
    for (const [key, amount] of Object.entries(job.required_resources || {})) {
      GameState.resources[key] = (GameState.resources[key] || 0) - amount;
    }

    // Reward logic
    if (job.produces) {
      for (const [res, value] of Object.entries(job.produces)) {
        if (typeof value === "object" && value.chance) {
          if (Math.random() < value.chance) {
            GameState.resources[res] = (GameState.resources[res] || 0) + 1;
          }
        } else {
          GameState.resources[res] = (GameState.resources[res] || 0) + value;
        }
      }
    }

    if (job.gp_reward) {
      GameState.resources.gold += job.gp_reward;
    }

    GameState.incrementJobCount(worker.jobId);

    // Reset timer for next cycle
    worker.timer = job.job_action_time || 1;
    // Progress bar update
    updateWorkerProgressBar(workerId, jobId, worker.timer, job.job_action_time);

  }
};

function updateWorkerProgressBar(workerId, jobId, currentTimer, totalTime) {
  const percent = Math.max(0, Math.min(100, Math.round((1 - currentTimer / totalTime) * 100)));

  const isPrimary = GameState.jobTimers?.[jobId]?.firstWorker === workerId;
  const barId = isPrimary ? `progress-${jobId}` : `progress-${jobId}-w${workerId}`;
  const bar = document.getElementById(barId);

  if (bar) {
    bar.style.width = `${percent}%`;
  }
}