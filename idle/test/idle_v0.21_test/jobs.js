// jobs.js — handles job logic only (used by idlegame.js)

// Register functions in the global scope for use without modules
window.getBestToolForJob = function(jobId, resources) {
  const toolPriority = {
    mining: [["god_pickaxe", "dragon_pickaxe", "rune_pickaxe", "adamant_pickaxe", "mithril_pickaxe", "black_pickaxe", "steel_pickaxe", "iron_pickaxe", "bronze_pickaxe"]],
    fishing: [["god_rod", "dragon_rod", "rune_rod", "adamant_rod", "mithril_rod", "black_rod", "steel_rod", "iron_rod", "bronze_rod"]],
    woodcutting: [["god_axe", "dragon_axe", "rune_axe", "adamant_axe", "mithril_axe", "black_axe", "steel_axe", "iron_axe", "bronze_axe"]],
    cooking: [["god_gloves", "dragon_gloves", "rune_gloves", "adamant_gloves", "mithril_gloves", "black_gloves", "steel_gloves", "iron_gloves", "bronze_gloves"]],
    thieving: [["god_boots", "dragon_boots", "rune_boots", "adamant_boots", "mithril_boots", "black_boots", "steel_boots", "iron_boots", "bronze_boots"]]
  };
  return toolPriority[jobId] || [];
};

window.assignTools = function(jobId, count, resources, toolsInUse) {
  const toolSets = getBestToolForJob(jobId, resources);
  const assignedToolSets = [];
  for (let i = 0; i < count; i++) {
    const toolsForThisWorker = [];
    for (const slotOptions of toolSets) {
      let foundTool = null;
      for (const tool of slotOptions) {
        const available = (resources[tool] || 0) - (toolsInUse[tool] || 0);
        if (available > 0) {
          toolsInUse[tool] = (toolsInUse[tool] || 0) + 1;
          foundTool = tool;
          break;
        }
      }
      toolsForThisWorker.push(foundTool);
    }
    assignedToolSets.push(toolsForThisWorker);
  }
  return assignedToolSets;
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