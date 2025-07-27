// display.js — shared logic for inventory/resource display
// Setup global Display object
window.Display = window.Display || {};


Display.updateResourceDisplay = function() {
  // 🔄 Live-create new sidebar cards and section wrappers if missing
  const sectionTitles = {
    "sidebar-section-resources": "Resources",
    "sidebar-section-recipes": "Recipes",
    "sidebar-section-gear": "Weapons & Armor",
    "sidebar-section-tools": "Tools"
  };

  Object.keys(GameState.resources).forEach(key => {
    const sidebarKey = `${key}_sidebar`;

    if (key === "gold" || sidebarKey in Display._elements) return; // ✅ skip if already rendered or is 'gold'

    console.log(`🆕 Live-adding sidebar card for: ${key}`);

    // Determine section type
    const isRecipe = key.startsWith("recipe_");
    const isGear = GameState.gearParts?.some(part => key.endsWith(`_${part}`));
    const isTool = GameState.toolParts?.some(part => key.endsWith(`_${part}`));

    let containerId;
    if (isRecipe) containerId = "sidebar-section-recipes";
    else if (isGear) containerId = "sidebar-section-gear";
    else if (isTool) containerId = "sidebar-section-tools";
    else containerId = "sidebar-section-resources";

    const grid = Sidebar.ensureSidebarSection(containerId, sectionTitles[containerId] || "Other");

    if (grid) {
      Display.prebuildItemDisplay([key], {
        default: grid,
        recipe: grid,
        gear: grid,
        tool: grid,
        misc: grid
      }, true);
    }

  });



  Object.entries(Display._elements).forEach(([key, element]) => {
    const resourceKey = key.replace(/_sidebar$/, "");  // ✅ Fix here
    const total = GameState.resources[resourceKey] || 0;
    const equipped = GameState.countEquippedItems(resourceKey);
    const free = total;
    const displayValue = equipped > 0 ? `${free} (${equipped})` : `${free}`;


    if (Display._lastValues[key] !== displayValue) {
      element.innerHTML = displayValue;
      Display._lastValues[key] = displayValue;
    }
  });

  // Gold display (non-sidebar)
  const goldEl = document.getElementById("gold-count");
  if (goldEl) {
    const goldValue = GameState.resources.gold || 0;
    if (Display._lastValues.gold !== goldValue) {
      goldEl.textContent = goldValue;
      Display._lastValues.gold = goldValue;
    }
  }
};

Display._elements = {};
Display._lastValues = {};

Display.prebuildItemDisplay = function(itemKeys, containers, isSidebar = false) {
  // Ensure containers are valid, incase more issue in the future
  if (!containers.default && !containers.recipe && !containers.gear && !containers.tool && !containers.misc) {
    console.warn("⚠️ prebuildItemDisplay received no valid containers!", containers);
  }

  if (!Display._elements) Display._elements = {};
  if (!Display._lastValues) Display._lastValues = {};

  itemKeys.forEach(key => {
    const createCard = (key, container) => {
      const card = document.createElement("div");
      card.className = isSidebar ? "sidebar-item-card" : "";
      card.id = `item-card-${key}${isSidebar ? "-sidebar" : ""}`;

      const innerCard = document.createElement("div");
      innerCard.className = "card bg-white border shadow-sm d-flex align-items-center";

      const img = document.createElement("img");
      let iconKey = key.startsWith("recipe_") ? key : key;
      img.src = `assets/icons/${iconKey}_icon.png`;
      img.alt = key;
      img.title = key.replace(/^recipe_/, "Recipe ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      img.width = 24;
      img.height = 24;


      const text = document.createElement("div");
      text.id = `item-count-${key}${isSidebar ? "-sidebar" : ""}`;
      text.innerHTML = "0";

      img.onerror = () => {
        img.remove();
        const fallback = document.createElement("div");
        fallback.className = "fallback-text";
        fallback.textContent = key.replace(/_/g, ' ');
        innerCard.insertBefore(fallback, text);
      };

      innerCard.appendChild(img);
      innerCard.appendChild(text);
      card.appendChild(innerCard);
      container.appendChild(card);

      const trackingKey = isSidebar ? `${key}_sidebar` : key;
      Display._elements[trackingKey] = text;
      Display._lastValues[trackingKey] = null;
    };

    // Determine the container based on the key
    if (key.startsWith("recipe_")) {
      createCard(key, containers.recipe);
    } else if (GameState.gearParts.some(part => key.endsWith(`_${part}`))) {
      createCard(key, containers.gear);
    } else if (GameState.toolParts.some(part => key.endsWith(`_${part}`))) {
      createCard(key, containers.tool);
    } else if (containers.misc && key in (GameState.misc || {})) {
      createCard(key, containers.misc); // ✅ put misc items like victory_trophy here
    } else if (key !== "gold") {
      createCard(key, containers.default);
    }
  });
};


window.showToast = function(message, duration = 2500) {
  const toast = document.getElementById("game-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.opacity = 1;

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.opacity = 0;
  }, duration);
};

Display.populateJobs = function() {
  const skillingContainer = document.getElementById("skilling-jobs");
  const combatContainer = document.getElementById("combat-jobs");
  skillingContainer.innerHTML = '';
  combatContainer.innerHTML = '';

  Object.entries(GameState.jobs).forEach(([jobId, job]) => {
      const jobName = jobId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const card = document.createElement('div');
      card.className = 'card border shadow-sm p-2 job-card';

      // Event listener for job card clicks to assign/unassign workers
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        assignWorkerToJobCard(jobId);
      });


      card.addEventListener("contextmenu", (e) => {
          e.preventDefault(); // Prevent right-click menu
          unassignWorkerFromJobCard(jobId);
      });


      // Create header row container
      const headerRow = document.createElement('div');
      headerRow.className = 'd-flex justify-content-between align-items-center mb-1 gap-2';

      // Left side: job name
      const jobTitle = document.createElement('strong');
      jobTitle.textContent = jobName;

      // Right side: controls
      const controls = document.createElement('div');
      controls.className = 'd-flex align-items-center gap-2';
      controls.innerHTML = `
      <button class="btn btn-sm btn-danger">−</button>
      <span id="count-${jobId}" class="fw-bold">0</span>
      <button class="btn btn-sm btn-success">+</button>
      `;

      const requiresIcons = document.createElement("div");
      requiresIcons.className = "d-flex flex-wrap align-items-center gap-2";

      if (job.required_resources) {
          for (const [key, amount] of Object.entries(job.required_resources)) {
              requiresIcons.appendChild(renderItemIcon(key, amount));
          }
      }
      if (job.required_gear && job.required_gear !== "none") {
          const parts = job.required_gear.split(",");
          parts.forEach(req => {
              const key = req.trim(); // e.g., "iron_sword"
              const icon = renderItemIcon(key, null);
              icon.title = key.replace(/_/g, ' '); // Tooltip
              requiresIcons.appendChild(icon);
          });
      }

      if (job.food_cost) {
          requiresIcons.appendChild(renderItemIcon("cooked_fish", job.food_cost));
      }


      const producesIcons = document.createElement("div");
      producesIcons.className = "d-flex flex-wrap align-items-center gap-2";

      if (job.produces) {
          for (const [key, val] of Object.entries(job.produces)) {
              if (typeof val === "object" && val.chance) {
                  const icon = renderItemIcon(key);
                  icon.title = `Chance: ${Math.round(val.chance * 100)}%`;
                  producesIcons.appendChild(icon);
              } else {
                  producesIcons.appendChild(renderItemIcon(key, val));
              }
          }
      }
      if (job.gp_reward) {
          producesIcons.appendChild(renderItemIcon("gold", job.gp_reward));
      }

      // Tracker for completed jobs counter
      const tracker = document.createElement('div');
      tracker.className = 'small text-muted mt-1';
      tracker.id = `completed-${jobId}`;

      // Initial render of completed jobs counter
      const completed = GameState.jobCompletionCount?.[jobId] || 0;
      tracker.textContent = `Completed: ${completed}`;


      const [minusBtn, plusBtn] = controls.querySelectorAll('button');

      // Attach events for adding/removing workers
      minusBtn.onclick = (e) => {
        e.stopPropagation();
        unassignWorkerFromJobCard(jobId);
      };

      plusBtn.onclick = (e) => {
        e.stopPropagation();
        assignWorkerToJobCard(jobId);
      };


      // Assemble header row
      headerRow.appendChild(jobTitle);
      headerRow.appendChild(controls);

      // Progress bar container
      const progressWrapper = document.createElement("div");
      progressWrapper.className = "progress mt-1";
      progressWrapper.style.height = "6px";
      progressWrapper.innerHTML = `<div class="progress-bar bg-success" id="progress-${jobId}" role="progressbar" style="width: 0%"></div>`;
      // Detailed progress bar wrapper
      const detailedProgressWrapper = document.createElement("div");
      detailedProgressWrapper.id = `detailed-bars-${jobId}`;
      detailedProgressWrapper.style.display = "none"; // hidden by default
      detailedProgressWrapper.className = "d-flex flex-column gap-1 mt-1";

      // Clear header row

      // 🕒 Job Time + progress bar (stacked)
      const jobTimeWrapper = document.createElement("div");
      jobTimeWrapper.className = "pt-2 mt-2 border-top";
      jobTimeWrapper.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="text-muted small fw-bold">
          <img src="assets/icons/job_timer_icon.png" alt="" width="24" height="24" class="me-1" title="Time taken to complete the job">
          <span>Job Time: ${job.job_action_time || 1}s</span>
          </div>
      </div>`;
      jobTimeWrapper.appendChild(progressWrapper);
      jobTimeWrapper.appendChild(detailedProgressWrapper); // hidden stacked progress bars

      // Add toggle button for detailed progress bars
      // const toggleBtn = jobTimeWrapper.querySelector(".btn-toggle-bars");
      // toggleBtn.addEventListener("click", () => {
      //     const bars = document.getElementById(`detailed-bars-${jobId}`);
      //     if (bars.style.display === "none") {
      //         bars.style.display = "flex";
      //         toggleBtn.textContent = "🔼";
      //     } else {
      //         bars.style.display = "none";
      //         toggleBtn.textContent = "🔽";
      //     }
      // });

      // 🎯 Requires
      const requiresBlock = document.createElement("div");
      requiresBlock.className = "pt-2 mt-2 border-top";
      requiresBlock.innerHTML = `
      <div class="text-muted small fw-bold mb-1">
          <img src="assets/icons/job_requirement_icon.png" 
              alt="" 
              width="24" 
              height="24" 
              class="me-1" 
              title="Items needed to perform the job">
              <span>Requires</span>
      </div>`;

      requiresBlock.appendChild(requiresIcons);

      // 🎁 Produces
      const producesBlock = document.createElement("div");
      producesBlock.className = "pt-2 mt-2 border-top";
      producesBlock.innerHTML = `
      <div class="text-muted small fw-bold mb-1">
          <img src="assets/icons/job_produce_icon.png" 
              alt="" 
              width="24" 
              height="24" 
              class="me-1" 
              title="Items or gold rewarded when job is completed">
              <span>Produces</span>
      </div>`;
      producesBlock.appendChild(producesIcons);

      // ✅ Completed
      tracker.className = "pt-2 mt-2 border-top small text-muted";

      card.appendChild(headerRow);
      card.appendChild(jobTimeWrapper);
      card.appendChild(requiresBlock);
      card.appendChild(producesBlock);
      card.appendChild(tracker);

      // ✅ Append to correct section
      if (job.job_type === "combat") {
          combatContainer.appendChild(card);
      } else {
          skillingContainer.appendChild(card);
      }
  });
};

function renderItemIcon(key, amount = null) {
  // TODO: CSS need to be added to style.css
  const img = document.createElement("img");
  img.src = `assets/icons/${key}_icon.png`;
  img.alt = key;
  img.title = key.replace(/^recipe_/, "Recipe ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  img.style.width = "20px";
  img.style.height = "20px";
  img.style.objectFit = "contain";
  img.style.marginRight = "4px";

  const fallback = document.createElement("div");
  fallback.className = "fallback-text";
  fallback.textContent = key.replace(/_/g, ' ');
  fallback.style.width = "20px";
  fallback.style.height = "20px";
  fallback.style.fontSize = "0.6rem";
  fallback.style.display = "flex";
  fallback.style.alignItems = "center";
  fallback.style.justifyContent = "center";
  fallback.style.background = "#eee";
  fallback.style.border = "1px solid #ccc";
  fallback.style.borderRadius = "3px";

  img.onerror = () => {
    img.remove();
    wrapper.insertBefore(fallback, wrapper.firstChild);
  };

  const wrapper = document.createElement("span");
  wrapper.className = "d-inline-flex align-items-center me-2";
  wrapper.appendChild(img);

  if (amount !== null) {
      const text = document.createElement("span");
      text.textContent = `x${amount}`;
      text.className = "ms-1";
      wrapper.appendChild(text);
  }

  return wrapper;
}

Display.updateUI = function(config = {}) {
  const {
    goldDisplay = document.getElementById('gold-count'),
    workerDisplay = document.getElementById('worker-count'),
    idleDisplay = document.getElementById('idle-count'),
    costDisplay = document.getElementById('worker-cost'),
    buyBtn = document.getElementById('buy-worker'),
    jobList = Object.keys(GameState.jobs).map(id => ({ id })),
    lastState = { gold: null, workers: null, idle: null, assignments: {} },
  } = config;

  const currentGold = GameState.resources.gold;
  const currentWorkers = GameState.ownedWorkers.length;
  const currentIdle = GameState.getIdleWorkers();
  const totalJobEl = document.getElementById("total-job-count");

  const nextWorkerId = GameState.getNextWorkerId();
  const nextWorkerCost = GameState.getNextWorkerCost();

  if (currentGold !== lastState.gold) {
    goldDisplay.textContent = currentGold;
    buyBtn.disabled = currentGold < nextWorkerCost;
    lastState.gold = currentGold;
  }

  if (currentWorkers !== lastState.workers) {
    workerDisplay.textContent = currentWorkers;
    costDisplay.textContent = nextWorkerCost;
    lastState.workers = currentWorkers;
  }

  if (currentIdle !== lastState.idle) {
    idleDisplay.textContent = currentIdle;
    lastState.idle = currentIdle;
  }

  if (totalJobEl) {
    totalJobEl.textContent = GameState.getTotalJobCompletions();
  }

  // check assigned workers and jobs counter for each job card
  jobList.forEach(job => {
    const currentCount = GameState.assignments[job.id] || 0;
    if (lastState.assignments[job.id] !== currentCount) {
      const countSpan = document.getElementById(`count-${job.id}`);
      if (countSpan) countSpan.textContent = currentCount;
      lastState.assignments[job.id] = currentCount;
    }

    // Live update completed jobs counter
    const completedEl = document.getElementById(`completed-${job.id}`);
    const currentCompleted = GameState.jobCompletionCount?.[job.id] || 0;
    if (completedEl && completedEl.textContent !== `Completed: ${currentCompleted}`) {
      completedEl.textContent = `Completed: ${currentCompleted}`;
    }
  });
};

// assignWorkerToJobCard check gear/tool requirements and if workers is available
function assignWorkerToJobCard(jobId) {
  const idleWorkerId = GameState.ownedWorkers.find(wid => !GameState.workerData[wid]?.jobId);

  if (!idleWorkerId) {
    showToast("❌ No idle workers available to assign.");
    return false;
  }

  if (GameState.jobs[jobId]?.job_type === "combat" && !Jobs.checkRequiredEquipment(jobId)) {
    showToast("❌ You don’t have the required gear to assign a worker to this combat job.");
    return false;
  }

  Jobs.assignWorkerToJob(idleWorkerId, jobId);
  Display.updateUI();
  Display.updateResourceDisplay();
  GameState.saveProgress();
  return true;
}

// unassignWorkerFromJobCard checks if a worker is assigned to the job and unassigns them
function unassignWorkerFromJobCard(jobId) {
  const assignedWorkerId = Object.entries(GameState.workerData).find(
    ([wid, data]) => data.jobId === jobId
  )?.[0];

  if (!assignedWorkerId) {
    showToast("❌ No workers assigned to this job.");
    return false;
  }

  Jobs.unassignWorkerFromJob(assignedWorkerId);
  Display.updateUI();
  Display.updateResourceDisplay();
  GameState.saveProgress();

  // If no one is assigned anymore, reset progress bar
  const stillAssigned = Object.values(GameState.workerData).some(
    worker => worker.jobId === jobId
  );

  if (!stillAssigned) {
    const bar = document.getElementById(`progress-${jobId}`);
    if (bar) bar.style.width = "0%";

    const detailedContainer = document.getElementById(`detailed-bars-${jobId}`);
    if (detailedContainer) detailedContainer.innerHTML = "";
  }

  return true;
}