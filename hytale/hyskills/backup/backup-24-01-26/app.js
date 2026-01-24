// HySkills Builder - Main Application Logic

let skills = [];
let currentSkillIndex = null;
let editingTriggerIndex = null;
let editingUnlockIndex = null;
let editingRequirementIndex = null;
let editingLockedItemIndex = null;

// Temporary lists for modals
let tempTriggerAllowList = [];
let tempTriggerDenyList = [];
let tempRequirementAllowList = [];
let tempRequirementDenyList = [];

// Game data for autocomplete
let gameData = null;
let modFunctions = null;
let allEntities = [];
let allItems = [];
let allBlocks = [];

// Section collapse state (persisted in localStorage)
let sectionCollapseState = {
  requirements: false,
  triggers: false,
  unlocks: false,
  lockedItems: false
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  loadFromLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  setupAutocomplete();
});

// Load game data from 3 separate files
async function loadGameData() {
  try {
    // Load all 3 files in parallel
    const [entitiesRes, objectsRes, modFunctionsRes] = await Promise.all([
      fetch('entities.json'),
      fetch('items_and_blocks.json'),
      fetch('mod_functions.json')
    ]);

    const entities = await entitiesRes.json();
    const objects = await objectsRes.json();
    modFunctions = await modFunctionsRes.json();

    // Build gameData structure for category browser
    gameData = {
      entities: entities,
      items: {},
      blocks: {}
    };

    // Auto-categorize items and blocks from flat array
    const itemCategories = {
      weapons: [],
      tools: [],
      armor: [],
      consumables: [],
      materials: [],
      containers: [],
      fish: [],
      plants: [],
      equipment: [],
      misc: []
    };

    const blockCategories = {
      terrain: [],
      stone: [],
      ores: [],
      wood: [],
      building: [],
      furniture: [],
      crafting_stations: [],
      spawners: [],
      misc: []
    };

    // Categorize each object by its ID prefix
    objects.forEach(obj => {
      const id = obj.id;

      // Skip state variants (items with * prefix are usually states)
      if (id.startsWith('*')) return;

      // Weapons
      if (id.startsWith('Weapon_')) {
        itemCategories.weapons.push(id);
      }
      // Tools
      else if (id.startsWith('Tool_')) {
        itemCategories.tools.push(id);
      }
      // Armor
      else if (id.startsWith('Armor_')) {
        itemCategories.armor.push(id);
      }
      // Consumables
      else if (id.startsWith('Food_') || id.startsWith('Potion_') || id.startsWith('Bandage_')) {
        itemCategories.consumables.push(id);
      }
      // Materials
      else if (id.startsWith('Ingredient_') || id.startsWith('Cloth_') || id.startsWith('Ore_')) {
        itemCategories.materials.push(id);
      }
      // Fish
      else if (id.startsWith('Fish_')) {
        itemCategories.fish.push(id);
      }
      // Containers
      else if (id.startsWith('Container_')) {
        itemCategories.containers.push(id);
      }
      // Plants/Farming
      else if (id.startsWith('Plant_') || id.startsWith('Farming_') || id.startsWith('Egg_') || id.startsWith('Tree_')) {
        itemCategories.plants.push(id);
      }
      // Equipment (gliders, etc)
      else if (id.startsWith('Glider_')) {
        itemCategories.equipment.push(id);
      }
      // Blocks
      else if (id.startsWith('Block_')) {
        blockCategories.building.push(id);
      }
      // Furniture & Decoration
      else if (id.startsWith('Furniture_') || id.startsWith('Deco_')) {
        blockCategories.furniture.push(id);
      }
      // Terrain
      else if (id.startsWith('Soil_') || id.startsWith('Rock_') || id.startsWith('Rubble_')) {
        blockCategories.terrain.push(id);
      }
      // Crafting stations
      else if (id.startsWith('Alchemy_') || id.startsWith('Bench_') || id.startsWith('Tinkering_')) {
        blockCategories.crafting_stations.push(id);
      }
      // Spawners
      else if (id.startsWith('Spawn_') || id.startsWith('Spawner_')) {
        blockCategories.spawners.push(id);
      }
      // Wood/Trees
      else if (id.startsWith('Wood_')) {
        blockCategories.wood.push(id);
      }
      // Skip debug/test/editor items
      else if (id.startsWith('Debug_') || id.startsWith('Test_') || id.startsWith('Editor_') ||
               id.startsWith('Prototype_') || id.startsWith('Template_') || id.startsWith('Example_')) {
        // Skip these
      }
      // Other items go to misc
      else {
        itemCategories.misc.push(id);
      }
    });

    // Remove empty categories and assign to gameData
    for (const [cat, items] of Object.entries(itemCategories)) {
      if (items.length > 0) {
        gameData.items[cat] = items.sort();
      }
    }

    for (const [cat, blocks] of Object.entries(blockCategories)) {
      if (blocks.length > 0) {
        gameData.blocks[cat] = blocks.sort();
      }
    }

    // Flatten for autocomplete
    allEntities = [];
    for (const category in gameData.entities) {
      allEntities.push(...gameData.entities[category]);
    }
    allEntities = [...new Set(allEntities)].sort();

    allItems = [];
    for (const category in gameData.items) {
      allItems.push(...gameData.items[category]);
    }
    allItems = [...new Set(allItems)].sort();

    allBlocks = [];
    for (const category in gameData.blocks) {
      allBlocks.push(...gameData.blocks[category]);
    }
    allBlocks = [...new Set(allBlocks)].sort();

    console.log(`Loaded ${allEntities.length} entities, ${allItems.length} items, ${allBlocks.length} blocks`);
  } catch (err) {
    console.error('Failed to load game data:', err);
    gameData = { entities: {}, items: {}, blocks: {} };
    modFunctions = { triggerTypes: [], unlockTypes: [], requirementTypes: [] };
  }
}

// Autocomplete functionality
function setupAutocomplete() {
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('autocomplete-input')) {
      showAutocomplete(e.target);
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('autocomplete-input') && !e.target.classList.contains('autocomplete-item')) {
      hideAllAutocomplete();
    }
  });
}

function showAutocomplete(input) {
  const value = input.value.toLowerCase().trim();
  const type = input.dataset.autocompleteType || 'all';

  let dropdown = input.parentElement.querySelector('.autocomplete-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);
  }

  if (value.length < 1) {
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    return;
  }

  let suggestions = [];
  if (type === 'entities' || type === 'all') {
    suggestions.push(...allEntities.filter(e => e.toLowerCase().includes(value)));
  }
  if (type === 'items' || type === 'all') {
    suggestions.push(...allItems.filter(i => i.toLowerCase().includes(value)));
  }
  if (type === 'blocks' || type === 'all') {
    suggestions.push(...allBlocks.filter(b => b.toLowerCase().includes(value)));
  }

  // Filter out items already in the corresponding list
  const inputId = input.id;
  if (inputId === 'trigger-allow-input') {
    suggestions = suggestions.filter(s => !tempTriggerAllowList.includes(s));
  } else if (inputId === 'trigger-deny-input') {
    suggestions = suggestions.filter(s => !tempTriggerDenyList.includes(s));
  } else if (inputId === 'requirement-allow-input') {
    suggestions = suggestions.filter(s => !tempRequirementAllowList.includes(s));
  } else if (inputId === 'requirement-deny-input') {
    suggestions = suggestions.filter(s => !tempRequirementDenyList.includes(s));
  }

  suggestions = [...new Set(suggestions)].slice(0, 15);

  if (suggestions.length === 0) {
    dropdown.innerHTML = '<div class="autocomplete-item text-muted">No matches found</div>';
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = suggestions.map(s =>
    `<div class="autocomplete-item" onclick="selectAutocomplete(this, '${s}')">${highlightMatch(s, value)}</div>`
  ).join('');
  dropdown.style.display = 'block';
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) + '<strong>' + text.substring(idx, idx + query.length) + '</strong>' + text.substring(idx + query.length);
}

function selectAutocomplete(element, value) {
  const dropdown = element.parentElement;
  const input = dropdown.parentElement.querySelector('.autocomplete-input');
  input.value = value;
  dropdown.style.display = 'none';
  input.focus();
}

function hideAllAutocomplete() {
  document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.style.display = 'none');
}

// Category browser
let currentCategoryTab = 'allow';
let categorySearchFilter = '';

function renderCategoryBrowsers() {
  const browser = document.getElementById('trigger-categories');
  if (!gameData || !browser) return;

  const existingItems = currentCategoryTab === 'allow' ? tempTriggerAllowList : tempTriggerDenyList;
  browser.innerHTML = buildCategoryHTML(currentCategoryTab, existingItems, categorySearchFilter);
  updateCategoryTabs();
}

function switchCategoryTab(tab) {
  currentCategoryTab = tab;
  updateCategoryTabs();
  renderCategoryBrowsers();
}

function updateCategoryTabs() {
  const allowTab = document.getElementById('tab-allow');
  const denyTab = document.getElementById('tab-deny');

  if (!allowTab || !denyTab) return;

  // Update counts
  allowTab.innerHTML = `Browse for Allow List <span class="badge bg-light text-dark ms-1">${tempTriggerAllowList.length}</span>`;
  denyTab.innerHTML = `Browse for Deny List <span class="badge bg-light text-dark ms-1">${tempTriggerDenyList.length}</span>`;

  // Update styling
  if (currentCategoryTab === 'allow') {
    allowTab.classList.add('active');
    allowTab.classList.remove('deny-mode');
    denyTab.classList.remove('active', 'deny-mode');
  } else {
    denyTab.classList.add('active', 'deny-mode');
    allowTab.classList.remove('active');
  }
}

function filterCategories() {
  const searchInput = document.getElementById('category-search');
  categorySearchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';
  renderCategoryBrowsers();
}

function buildCategoryHTML(listType, existingItems, searchFilter = '') {
  let html = '';
  let hasContent = false;

  // Entities
  let entityHtml = '';
  for (const category in gameData.entities) {
    const items = gameData.entities[category];
    let availableItems = items.filter(item => !existingItems.includes(item));

    // Apply search filter
    if (searchFilter) {
      availableItems = availableItems.filter(item => item.toLowerCase().includes(searchFilter));
    }

    if (availableItems.length === 0) continue;
    hasContent = true;

    entityHtml += `<span class="category-header" onclick="addEntireCategory('${listType}', 'entities', '${category}')" style="font-size:0.65em; color:#00cec9; cursor:pointer; display:block; margin-top:5px;">${category} <small>(+${availableItems.length})</small></span>`;
    entityHtml += availableItems.map(item => `<span class="category-item" onclick="addFromCategory('${listType}', '${item}')">${item}</span>`).join('');
  }
  if (entityHtml) {
    html += '<div class="category-title">Entities</div>' + entityHtml;
  }

  // Items
  let itemHtml = '';
  for (const category in gameData.items) {
    const items = gameData.items[category];
    let availableItems = items.filter(item => !existingItems.includes(item));

    if (searchFilter) {
      availableItems = availableItems.filter(item => item.toLowerCase().includes(searchFilter));
    }

    if (availableItems.length === 0) continue;
    hasContent = true;

    itemHtml += `<span class="category-header" onclick="addEntireCategory('${listType}', 'items', '${category}')" style="font-size:0.65em; color:#fdcb6e; cursor:pointer; display:block; margin-top:5px;">${category} <small>(+${availableItems.length})</small></span>`;
    itemHtml += availableItems.map(item => `<span class="category-item" onclick="addFromCategory('${listType}', '${item}')">${item}</span>`).join('');
  }
  if (itemHtml) {
    html += '<div class="category-title mt-2">Items</div>' + itemHtml;
  }

  // Blocks
  let blockHtml = '';
  for (const category in gameData.blocks) {
    const items = gameData.blocks[category];
    let availableItems = items.filter(item => !existingItems.includes(item));

    if (searchFilter) {
      availableItems = availableItems.filter(item => item.toLowerCase().includes(searchFilter));
    }

    if (availableItems.length === 0) continue;
    hasContent = true;

    blockHtml += `<span class="category-header" onclick="addEntireCategory('${listType}', 'blocks', '${category}')" style="font-size:0.65em; color:#a29bfe; cursor:pointer; display:block; margin-top:5px;">${category} <small>(+${availableItems.length})</small></span>`;
    blockHtml += availableItems.map(item => `<span class="category-item" onclick="addFromCategory('${listType}', '${item}')">${item}</span>`).join('');
  }
  if (blockHtml) {
    html += '<div class="category-title mt-2">Blocks</div>' + blockHtml;
  }

  if (!hasContent) {
    if (searchFilter) {
      return '<p class="text-muted small text-center">No matches found</p>';
    }
    return '<p class="text-muted small text-center">All items added!</p>';
  }

  return html;
}

function addEntireCategory(listType, dataType, category) {
  const items = gameData[dataType][category];
  if (!items) return;

  // Apply search filter when adding entire category
  const searchFilter = categorySearchFilter;
  const targetList = listType === 'allow' ? tempTriggerAllowList : tempTriggerDenyList;

  let addedCount = 0;
  items.forEach(item => {
    // Only add items that match the search filter (if any) and aren't already in the list
    if (!targetList.includes(item)) {
      if (!searchFilter || item.toLowerCase().includes(searchFilter)) {
        targetList.push(item);
        addedCount++;
      }
    }
  });

  renderTriggerLists();
  renderCategoryBrowsers();

  if (addedCount > 0) {
    showToast(`Added ${addedCount} items from ${category} to ${listType} list`);
  }
}

function addFromCategory(listType, value) {
  if (listType === 'allow') {
    if (!tempTriggerAllowList.includes(value)) {
      tempTriggerAllowList.push(value);
    }
  } else {
    if (!tempTriggerDenyList.includes(value)) {
      tempTriggerDenyList.push(value);
    }
  }
  renderTriggerLists();
  renderCategoryBrowsers();
}

function clearTriggerList(listType) {
  if (listType === 'allow') {
    tempTriggerAllowList = [];
  } else {
    tempTriggerDenyList = [];
  }
  renderTriggerLists();
  renderCategoryBrowsers();
  showToast(`Cleared ${listType} list`);
}

// Local Storage
function saveToLocalStorage() {
  localStorage.setItem('hyskills_data', JSON.stringify(skills));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('hyskills_data');
  if (saved) {
    try {
      skills = JSON.parse(saved);
    } catch (e) {
      skills = [];
    }
  }
  // Load collapse state
  const collapseState = localStorage.getItem('hyskills_collapse_state');
  if (collapseState) {
    try {
      sectionCollapseState = JSON.parse(collapseState);
    } catch (e) {
      // Keep default state
    }
  }
}

function saveCollapseState() {
  localStorage.setItem('hyskills_collapse_state', JSON.stringify(sectionCollapseState));
}

function toggleSection(section) {
  sectionCollapseState[section] = !sectionCollapseState[section];
  saveCollapseState();

  // Animate the section
  const container = document.getElementById(`${section}-container`);
  const icon = document.getElementById(`${section}-collapse-icon`);

  if (container) {
    if (sectionCollapseState[section]) {
      container.style.maxHeight = container.scrollHeight + 'px';
      container.offsetHeight; // Force reflow
      container.style.maxHeight = '0';
      container.classList.add('collapsed');
    } else {
      container.style.maxHeight = container.scrollHeight + 'px';
      container.classList.remove('collapsed');
      setTimeout(() => {
        container.style.maxHeight = 'none';
      }, 300);
    }
  }

  if (icon) {
    icon.style.transform = sectionCollapseState[section] ? 'rotate(-90deg)' : 'rotate(0deg)';
  }
}

// Toast notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
  toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Generate unique ID
function generateId() {
  return 'skill_' + Date.now();
}

// Skills List Management
function renderSkillsList() {
  const container = document.getElementById('skills-list');
  if (skills.length === 0) {
    container.innerHTML = '<p class="text-muted text-center p-3">No skills yet. Click "Add Skill" to create one.</p>';
    return;
  }

  const len = skills.length;
  container.innerHTML = skills.map((skill, index) => `
    <div class="skill-item p-3 rounded mb-2 ${currentSkillIndex === index ? 'active' : ''}" onclick="selectSkill(${index})">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${skill.displayName || 'Unnamed Skill'}</strong>
          <div class="small text-muted">ID: ${skill.id}</div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary ${index === 0 ? 'disabled' : ''}" onclick="event.stopPropagation(); moveSkill(${index}, -1)" title="Move up">↑</button>
          <button class="btn btn-sm btn-outline-secondary ${index === len - 1 ? 'disabled' : ''}" onclick="event.stopPropagation(); moveSkill(${index}, 1)" title="Move down">↓</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); duplicateSkill(${index})" title="Duplicate skill">Dup</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteSkill(${index})">X</button>
        </div>
      </div>
      <div class="mt-2 pt-2" style="border-top: 1px solid rgba(255,255,255,0.1);">
        <span class="badge badge-requirement me-1">${skill.requirements?.length || 0} req</span>
        <span class="badge badge-trigger me-1">${skill.triggers?.length || 0} triggers</span>
        <span class="badge badge-unlock me-1">${skill.unlocks?.length || 0} unlocks</span>
        <span class="badge badge-locked me-1">${skill.lockedItems?.length || 0} locked</span>
      </div>
    </div>
  `).join('');
}

function moveSkill(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= skills.length) return;

  // Swap skills
  [skills[index], skills[newIndex]] = [skills[newIndex], skills[index]];

  // Update currentSkillIndex if needed
  if (currentSkillIndex === index) {
    currentSkillIndex = newIndex;
  } else if (currentSkillIndex === newIndex) {
    currentSkillIndex = index;
  }

  saveToLocalStorage();
  renderSkillsList();
  updateJSONPreview();
}

function addNewSkill() {
  const newSkill = {
    id: generateId(),
    displayName: 'New Skill',
    description: '',
    baseXp: 100.0,
    multiplier: 1.0,
    maxLevel: 100,
    triggers: [],
    requirements: [],
    unlocks: [],
    lockedItems: [],
    statScaling: {},
    mechanics: []
  };

  skills.push(newSkill);
  currentSkillIndex = skills.length - 1;
  saveToLocalStorage();
  renderSkillsList();
  renderSkillEditor();
  updateJSONPreview();
  showToast('New skill created!');
}

function selectSkill(index) {
  currentSkillIndex = index;
  renderSkillsList();
  renderSkillEditor();
}

function deleteSkill(index) {
  if (!confirm('Delete this skill?')) return;
  skills.splice(index, 1);
  if (currentSkillIndex >= skills.length) {
    currentSkillIndex = skills.length > 0 ? skills.length - 1 : null;
  }
  saveToLocalStorage();
  renderSkillsList();
  if (currentSkillIndex !== null) {
    renderSkillEditor();
  } else {
    document.getElementById('skill-editor').innerHTML = '<div class="text-center text-muted py-5"><p>Select a skill from the list or create a new one</p></div>';
    document.getElementById('editor-title').textContent = 'Select or create a skill';
  }
  updateJSONPreview();
  showToast('Skill deleted', 'danger');
}

function duplicateSkill(index) {
  const skill = skills[index];
  const copy = JSON.parse(JSON.stringify(skill));
  copy.id = generateId();
  copy.displayName = (skill.displayName || 'Skill') + ' (Copy)';
  skills.push(copy);
  currentSkillIndex = skills.length - 1;
  saveToLocalStorage();
  renderSkillsList();
  renderSkillEditor();
  updateJSONPreview();
  showToast('Skill duplicated');
}

// Skill Editor
function renderSkillEditor() {
  if (currentSkillIndex === null) return;

  const skill = skills[currentSkillIndex];
  document.getElementById('editor-title').textContent = `Editing: ${skill.displayName}`;

  const editor = document.getElementById('skill-editor');
  editor.innerHTML = `
    <!-- Basic Info -->
    <div class="mb-4">
      <h6 class="section-header">Basic Information</h6>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Skill ID</label>
          <input type="text" class="form-control" value="${skill.id}" onchange="updateSkillField('id', this.value)">
        </div>
        <div class="col-md-6">
          <label class="form-label">Display Name</label>
          <input type="text" class="form-control" value="${skill.displayName}" onchange="updateSkillField('displayName', this.value)">
        </div>
        <div class="col-12">
          <label class="form-label">Description</label>
          <input type="text" class="form-control" value="${skill.description || ''}" placeholder="Short description of this skill..." onchange="updateSkillField('description', this.value)">
        </div>
        <div class="col-md-4">
          <label class="form-label">Base XP</label>
          <input type="number" class="form-control" value="${skill.baseXp}" step="0.1" onchange="updateSkillField('baseXp', parseFloat(this.value))">
          <small class="text-muted">Higher = longer levels</small>
        </div>
        <div class="col-md-4">
          <label class="form-label">Multiplier</label>
          <input type="number" class="form-control" value="${skill.multiplier}" step="0.01" onchange="updateSkillField('multiplier', parseFloat(this.value))">
          <small class="text-muted">XP scaling per level</small>
        </div>
        <div class="col-md-4">
          <label class="form-label">Max Level</label>
          <input type="number" class="form-control" value="${skill.maxLevel}" min="1" onchange="updateSkillField('maxLevel', parseInt(this.value))">
        </div>
      </div>
    </div>

    <!-- Requirements -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2 collapsible-header" onclick="toggleSection('requirements')">
        <h6 class="section-header mb-0" style="cursor: pointer;">
          <span id="requirements-collapse-icon" class="collapse-icon" style="transform: ${sectionCollapseState.requirements ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span>
          Requirements
          <span class="badge bg-secondary ms-2">${skill.requirements?.length || 0}</span>
        </h6>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy all requirements to another skill">Copy All</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getCopyAllDropdown('requirement')}
            </ul>
          </div>
          <button class="btn btn-sm btn-primary" onclick="openRequirementModal()">+ Add</button>
        </div>
      </div>
      <div id="requirements-container" class="collapsible-content ${sectionCollapseState.requirements ? 'collapsed' : ''}" style="${sectionCollapseState.requirements ? 'max-height: 0;' : ''}">
        ${renderRequirements(skill.requirements)}
      </div>
    </div>

    <!-- Triggers -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2 collapsible-header" onclick="toggleSection('triggers')">
        <h6 class="section-header mb-0" style="cursor: pointer;">
          <span id="triggers-collapse-icon" class="collapse-icon" style="transform: ${sectionCollapseState.triggers ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span>
          Triggers
          <span class="badge bg-secondary ms-2">${skill.triggers?.length || 0}</span>
        </h6>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy all triggers to another skill">Copy All</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getCopyAllDropdown('trigger')}
            </ul>
          </div>
          <button class="btn btn-sm btn-primary" onclick="openTriggerModal()">+ Add</button>
        </div>
      </div>
      <div id="triggers-container" class="collapsible-content ${sectionCollapseState.triggers ? 'collapsed' : ''}" style="${sectionCollapseState.triggers ? 'max-height: 0;' : ''}">
        ${renderTriggers(skill.triggers)}
      </div>
    </div>

    <!-- Unlocks -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2 collapsible-header" onclick="toggleSection('unlocks')">
        <h6 class="section-header mb-0" style="cursor: pointer;">
          <span id="unlocks-collapse-icon" class="collapse-icon" style="transform: ${sectionCollapseState.unlocks ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span>
          Unlocks
          <span class="badge bg-secondary ms-2">${skill.unlocks?.length || 0}</span>
        </h6>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy all unlocks to another skill">Copy All</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getCopyAllDropdown('unlock')}
            </ul>
          </div>
          <button class="btn btn-sm btn-primary" onclick="openUnlockModal()">+ Add</button>
        </div>
      </div>
      <div id="unlocks-container" class="collapsible-content ${sectionCollapseState.unlocks ? 'collapsed' : ''}" style="${sectionCollapseState.unlocks ? 'max-height: 0;' : ''}">
        ${renderUnlocks(skill.unlocks)}
      </div>
    </div>

    <!-- Locked Items -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2 collapsible-header" onclick="toggleSection('lockedItems')">
        <h6 class="section-header mb-0" style="cursor: pointer;">
          <span id="lockedItems-collapse-icon" class="collapse-icon" style="transform: ${sectionCollapseState.lockedItems ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span>
          Locked Items
          <span class="badge bg-secondary ms-2">${skill.lockedItems?.length || 0}</span>
        </h6>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy all locked items to another skill">Copy All</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getCopyAllDropdown('lockedItem')}
            </ul>
          </div>
          <button class="btn btn-sm btn-primary" onclick="openLockedItemModal()">+ Add</button>
        </div>
      </div>
      <div id="lockedItems-container" class="collapsible-content ${sectionCollapseState.lockedItems ? 'collapsed' : ''}" style="${sectionCollapseState.lockedItems ? 'max-height: 0;' : ''}">
        ${renderLockedItems(skill.lockedItems)}
      </div>
    </div>
  `;
}

function updateSkillField(field, value) {
  if (currentSkillIndex === null) return;
  skills[currentSkillIndex][field] = value;
  saveToLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  if (field === 'displayName') {
    document.getElementById('editor-title').textContent = `Editing: ${value}`;
  }
}

// Triggers
function renderTriggers(triggers) {
  if (!triggers || triggers.length === 0) {
    return '<p class="text-muted small">No triggers. Add one to define how XP is gained.</p>';
  }

  const len = triggers.length;
  return triggers.map((trigger, index) => `
    <div class="trigger-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-trigger">${trigger.type}</span>
          <span class="ms-2">+${trigger.xpReward} XP</span>
          ${trigger.cooldown > 0 ? `<span class="ms-2 text-muted small">(${trigger.cooldown}ms cooldown)</span>` : ''}
        </div>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary ${index === 0 ? 'disabled' : ''}" onclick="moveItem('trigger', ${index}, -1)" title="Move up">↑</button>
          <button class="btn btn-sm btn-outline-secondary ${index === len - 1 ? 'disabled' : ''}" onclick="moveItem('trigger', ${index}, 1)" title="Move down">↓</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="duplicateTrigger(${index})" title="Duplicate in this skill">Dup</button>
          <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy to another skill">Copy</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getOtherSkillsDropdown(index)}
            </ul>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="editTrigger(${index})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTrigger(${index})">X</button>
        </div>
      </div>
      ${trigger.allowList?.length > 0 ? `<div class="mt-2 small"><strong>Allow:</strong> ${trigger.allowList.slice(0, 5).map(i => `<span class="list-tag">${i}</span>`).join('')}${trigger.allowList.length > 5 ? `<span class="text-muted">+${trigger.allowList.length - 5} more</span>` : ''}</div>` : ''}
      ${trigger.denyList?.length > 0 ? `<div class="mt-1 small"><strong>Deny:</strong> ${trigger.denyList.slice(0, 5).map(i => `<span class="list-tag">${i}</span>`).join('')}${trigger.denyList.length > 5 ? `<span class="text-muted">+${trigger.denyList.length - 5} more</span>` : ''}</div>` : ''}
    </div>
  `).join('');
}

function openTriggerModal(editIndex = null) {
  editingTriggerIndex = editIndex;
  tempTriggerAllowList = [];
  tempTriggerDenyList = [];

  // Reset form
  document.getElementById('trigger-type').value = 'BLOCK_BREAK';
  document.getElementById('trigger-xp').value = 100;
  document.getElementById('trigger-cooldown').value = 0;
  document.getElementById('trigger-min-level').value = 0;
  document.getElementById('trigger-max-level').value = 2147483647;
  document.getElementById('trigger-requires-movement').checked = false;

  // If editing, populate with existing data
  if (editIndex !== null && currentSkillIndex !== null) {
    const trigger = skills[currentSkillIndex].triggers[editIndex];
    document.getElementById('trigger-type').value = trigger.type;
    document.getElementById('trigger-xp').value = trigger.xpReward;
    document.getElementById('trigger-cooldown').value = trigger.cooldown || 0;
    document.getElementById('trigger-min-level').value = trigger.minLevel || 0;
    document.getElementById('trigger-max-level').value = trigger.maxLevel || 2147483647;
    document.getElementById('trigger-requires-movement').checked = trigger.requiresMovement || false;
    tempTriggerAllowList = [...(trigger.allowList || [])];
    tempTriggerDenyList = [...(trigger.denyList || [])];
  }

  // Reset category browser state
  currentCategoryTab = 'allow';
  categorySearchFilter = '';
  const searchInput = document.getElementById('category-search');
  if (searchInput) searchInput.value = '';

  renderTriggerLists();
  renderCategoryBrowsers();
  new bootstrap.Modal(document.getElementById('triggerModal')).show();
}

function renderTriggerLists() {
  document.getElementById('trigger-allow-list').innerHTML = tempTriggerAllowList.map((item, i) =>
    `<span class="list-tag">${item}<span class="remove-tag" onclick="removeTriggerListItem('allow', ${i})">x</span></span>`
  ).join('');

  document.getElementById('trigger-deny-list').innerHTML = tempTriggerDenyList.map((item, i) =>
    `<span class="list-tag">${item}<span class="remove-tag" onclick="removeTriggerListItem('deny', ${i})">x</span></span>`
  ).join('');
}

function addToTriggerList(listType) {
  const input = document.getElementById(`trigger-${listType}-input`);
  const value = input.value.trim();
  if (!value) return;

  if (listType === 'allow') {
    tempTriggerAllowList.push(value);
  } else {
    tempTriggerDenyList.push(value);
  }

  input.value = '';
  renderTriggerLists();
}

function removeTriggerListItem(listType, index) {
  if (listType === 'allow') {
    tempTriggerAllowList.splice(index, 1);
  } else {
    tempTriggerDenyList.splice(index, 1);
  }
  renderTriggerLists();
  renderCategoryBrowsers();
}

function saveTrigger() {
  if (currentSkillIndex === null) return;

  const trigger = {
    type: document.getElementById('trigger-type').value,
    allowList: [...tempTriggerAllowList],
    denyList: [...tempTriggerDenyList],
    cooldown: parseInt(document.getElementById('trigger-cooldown').value) || 0,
    minLevel: parseInt(document.getElementById('trigger-min-level').value) || 0,
    maxLevel: parseInt(document.getElementById('trigger-max-level').value) || 2147483647,
    xpReward: parseInt(document.getElementById('trigger-xp').value) || 100,
    requiresMovement: document.getElementById('trigger-requires-movement').checked,
    xpValues: {}
  };

  if (editingTriggerIndex !== null) {
    skills[currentSkillIndex].triggers[editingTriggerIndex] = trigger;
  } else {
    skills[currentSkillIndex].triggers.push(trigger);
  }

  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
  bootstrap.Modal.getInstance(document.getElementById('triggerModal')).hide();
  showToast(editingTriggerIndex !== null ? 'Trigger updated!' : 'Trigger added!');
}

function editTrigger(index) {
  openTriggerModal(index);
}

function deleteTrigger(index) {
  if (!confirm('Delete this trigger?')) return;
  skills[currentSkillIndex].triggers.splice(index, 1);
  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
}

function getOtherSkillsDropdown(triggerIndex) {
  const otherSkills = skills.filter((s, i) => i !== currentSkillIndex);
  if (otherSkills.length === 0) {
    return '<li><span class="dropdown-item text-muted">No other skills</span></li>';
  }
  return skills.map((s, i) => {
    if (i === currentSkillIndex) return '';
    return `<li><a class="dropdown-item" href="#" onclick="copyTriggerToSkill(${triggerIndex}, ${i}); return false;">${s.displayName || s.id}</a></li>`;
  }).join('');
}

function duplicateTrigger(index) {
  const trigger = skills[currentSkillIndex].triggers[index];
  const copy = JSON.parse(JSON.stringify(trigger));
  skills[currentSkillIndex].triggers.push(copy);
  saveToLocalStorage();
  renderSkillEditor();
  updateJSONPreview();
  showToast('Trigger duplicated');
}

function copyTriggerToSkill(triggerIndex, targetSkillIndex) {
  const trigger = skills[currentSkillIndex].triggers[triggerIndex];
  const copy = JSON.parse(JSON.stringify(trigger));

  if (!skills[targetSkillIndex].triggers) {
    skills[targetSkillIndex].triggers = [];
  }
  skills[targetSkillIndex].triggers.push(copy);

  saveToLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  showToast(`Trigger copied to "${skills[targetSkillIndex].displayName || skills[targetSkillIndex].id}"`);
}

// Generic dropdown helper for copying items to other skills
function getSkillsDropdownFor(type, itemIndex) {
  const otherSkills = skills.filter((s, i) => i !== currentSkillIndex);
  if (otherSkills.length === 0) {
    return '<li><span class="dropdown-item text-muted">No other skills</span></li>';
  }
  return skills.map((s, i) => {
    if (i === currentSkillIndex) return '';
    return `<li><a class="dropdown-item" href="#" onclick="copyItemToSkill('${type}', ${itemIndex}, ${i}); return false;">${s.displayName || s.id}</a></li>`;
  }).join('');
}

function copyItemToSkill(type, itemIndex, targetSkillIndex) {
  let source, targetArray, itemName;

  switch (type) {
    case 'requirement':
      source = skills[currentSkillIndex].requirements[itemIndex];
      if (!skills[targetSkillIndex].requirements) skills[targetSkillIndex].requirements = [];
      targetArray = skills[targetSkillIndex].requirements;
      itemName = 'Requirement';
      break;
    case 'unlock':
      source = skills[currentSkillIndex].unlocks[itemIndex];
      if (!skills[targetSkillIndex].unlocks) skills[targetSkillIndex].unlocks = [];
      targetArray = skills[targetSkillIndex].unlocks;
      itemName = 'Unlock';
      break;
    case 'lockedItem':
      source = skills[currentSkillIndex].lockedItems[itemIndex];
      if (!skills[targetSkillIndex].lockedItems) skills[targetSkillIndex].lockedItems = [];
      targetArray = skills[targetSkillIndex].lockedItems;
      itemName = 'Locked item';
      break;
    default:
      return;
  }

  const copy = JSON.parse(JSON.stringify(source));
  targetArray.push(copy);

  saveToLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  showToast(`${itemName} copied to "${skills[targetSkillIndex].displayName || skills[targetSkillIndex].id}"`);
}

// Copy All dropdown helper
function getCopyAllDropdown(type) {
  const otherSkills = skills.filter((s, i) => i !== currentSkillIndex);
  if (otherSkills.length === 0) {
    return '<li><span class="dropdown-item text-muted">No other skills</span></li>';
  }
  return skills.map((s, i) => {
    if (i === currentSkillIndex) return '';
    return `<li><a class="dropdown-item" href="#" onclick="copyAllToSkill('${type}', ${i}); return false;">${s.displayName || s.id}</a></li>`;
  }).join('');
}

function copyAllToSkill(type, targetSkillIndex) {
  let sourceArray, targetArrayName, itemName;
  const skill = skills[currentSkillIndex];

  switch (type) {
    case 'requirement':
      sourceArray = skill.requirements || [];
      targetArrayName = 'requirements';
      itemName = 'requirements';
      break;
    case 'trigger':
      sourceArray = skill.triggers || [];
      targetArrayName = 'triggers';
      itemName = 'triggers';
      break;
    case 'unlock':
      sourceArray = skill.unlocks || [];
      targetArrayName = 'unlocks';
      itemName = 'unlocks';
      break;
    case 'lockedItem':
      sourceArray = skill.lockedItems || [];
      targetArrayName = 'lockedItems';
      itemName = 'locked items';
      break;
    default:
      return;
  }

  if (sourceArray.length === 0) {
    showToast(`No ${itemName} to copy`, 'warning');
    return;
  }

  if (!skills[targetSkillIndex][targetArrayName]) {
    skills[targetSkillIndex][targetArrayName] = [];
  }

  sourceArray.forEach(item => {
    const copy = JSON.parse(JSON.stringify(item));
    skills[targetSkillIndex][targetArrayName].push(copy);
  });

  saveToLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  showToast(`${sourceArray.length} ${itemName} copied to "${skills[targetSkillIndex].displayName || skills[targetSkillIndex].id}"`);
}

// Move item up/down in list
function moveItem(type, index, direction) {
  if (currentSkillIndex === null) return;

  let array;
  switch (type) {
    case 'trigger':
      array = skills[currentSkillIndex].triggers;
      break;
    case 'requirement':
      array = skills[currentSkillIndex].requirements;
      break;
    case 'unlock':
      array = skills[currentSkillIndex].unlocks;
      break;
    case 'lockedItem':
      array = skills[currentSkillIndex].lockedItems;
      break;
    default:
      return;
  }

  if (!array) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= array.length) return;

  // Swap items
  [array[index], array[newIndex]] = [array[newIndex], array[index]];

  saveToLocalStorage();
  renderSkillEditor();
  updateJSONPreview();
}

// Requirements
function renderRequirements(requirements) {
  if (!requirements || requirements.length === 0) {
    return '<p class="text-muted small">No requirements. Add one to restrict when skill XP can be gained.</p>';
  }

  const len = requirements.length;
  return requirements.map((req, index) => `
    <div class="requirement-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-requirement">${req.type}</span>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary ${index === 0 ? 'disabled' : ''}" onclick="moveItem('requirement', ${index}, -1)" title="Move up">↑</button>
          <button class="btn btn-sm btn-outline-secondary ${index === len - 1 ? 'disabled' : ''}" onclick="moveItem('requirement', ${index}, 1)" title="Move down">↓</button>
          <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy to another skill">Copy</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getSkillsDropdownFor('requirement', index)}
            </ul>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="editRequirement(${index})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRequirement(${index})">X</button>
        </div>
      </div>
      ${req.allowList?.length > 0 ? `<div class="mt-2 small"><strong>Allow:</strong> ${req.allowList.slice(0, 5).map(i => `<span class="list-tag">${i}</span>`).join('')}${req.allowList.length > 5 ? `<span class="text-muted">+${req.allowList.length - 5} more</span>` : ''}</div>` : ''}
      ${req.denyList?.length > 0 ? `<div class="mt-1 small"><strong>Deny:</strong> ${req.denyList.slice(0, 5).map(i => `<span class="list-tag">${i}</span>`).join('')}${req.denyList.length > 5 ? `<span class="text-muted">+${req.denyList.length - 5} more</span>` : ''}</div>` : ''}
    </div>
  `).join('');
}

function openRequirementModal(editIndex = null) {
  editingRequirementIndex = editIndex;
  tempRequirementAllowList = [];
  tempRequirementDenyList = [];

  document.getElementById('requirement-type').value = 'ITEM_IN_HAND';

  if (editIndex !== null && currentSkillIndex !== null) {
    const req = skills[currentSkillIndex].requirements[editIndex];
    document.getElementById('requirement-type').value = req.type;
    tempRequirementAllowList = [...(req.allowList || [])];
    tempRequirementDenyList = [...(req.denyList || [])];
  }

  renderRequirementLists();
  new bootstrap.Modal(document.getElementById('requirementModal')).show();
}

function renderRequirementLists() {
  document.getElementById('requirement-allow-list').innerHTML = tempRequirementAllowList.map((item, i) =>
    `<span class="list-tag">${item}<span class="remove-tag" onclick="removeRequirementListItem('allow', ${i})">x</span></span>`
  ).join('');

  document.getElementById('requirement-deny-list').innerHTML = tempRequirementDenyList.map((item, i) =>
    `<span class="list-tag">${item}<span class="remove-tag" onclick="removeRequirementListItem('deny', ${i})">x</span></span>`
  ).join('');
}

function addToRequirementList(listType) {
  const input = document.getElementById(`requirement-${listType}-input`);
  const value = input.value.trim();
  if (!value) return;

  if (listType === 'allow') {
    tempRequirementAllowList.push(value);
  } else {
    tempRequirementDenyList.push(value);
  }

  input.value = '';
  renderRequirementLists();
}

function removeRequirementListItem(listType, index) {
  if (listType === 'allow') {
    tempRequirementAllowList.splice(index, 1);
  } else {
    tempRequirementDenyList.splice(index, 1);
  }
  renderRequirementLists();
}

function saveRequirement() {
  if (currentSkillIndex === null) return;

  const requirement = {
    type: document.getElementById('requirement-type').value,
    allowList: [...tempRequirementAllowList],
    denyList: [...tempRequirementDenyList]
  };

  if (editingRequirementIndex !== null) {
    skills[currentSkillIndex].requirements[editingRequirementIndex] = requirement;
  } else {
    skills[currentSkillIndex].requirements.push(requirement);
  }

  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
  bootstrap.Modal.getInstance(document.getElementById('requirementModal')).hide();
  showToast(editingRequirementIndex !== null ? 'Requirement updated!' : 'Requirement added!');
}

function editRequirement(index) {
  openRequirementModal(index);
}

function deleteRequirement(index) {
  if (!confirm('Delete this requirement?')) return;
  skills[currentSkillIndex].requirements.splice(index, 1);
  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
}

// Unlocks
function renderUnlocks(unlocks) {
  if (!unlocks || unlocks.length === 0) {
    return '<p class="text-muted small">No unlocks. Add rewards players get when leveling up.</p>';
  }

  const len = unlocks.length;
  return unlocks.map((unlock, index) => {
    const valueTypeLabel = unlock.valueType === 'PERCENT_BASE' ? '% base' :
                          unlock.valueType === 'PERCENT_TOTAL' ? '% total' : '';
    return `
    <div class="unlock-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-unlock">${unlock.type}</span>
          <span class="ms-2">Level ${unlock.level}${unlock.everyLevel ? '+' : ''}</span>
          <span class="ms-2 text-muted">(+${unlock.amount}${valueTypeLabel})</span>
          ${unlock.target ? `<span class="ms-2 small">${unlock.target}</span>` : ''}
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary ${index === 0 ? 'disabled' : ''}" onclick="moveItem('unlock', ${index}, -1)" title="Move up">↑</button>
          <button class="btn btn-sm btn-outline-secondary ${index === len - 1 ? 'disabled' : ''}" onclick="moveItem('unlock', ${index}, 1)" title="Move down">↓</button>
          <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy to another skill">Copy</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getSkillsDropdownFor('unlock', index)}
            </ul>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="editUnlock(${index})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUnlock(${index})">X</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function openUnlockModal(editIndex = null) {
  editingUnlockIndex = editIndex;

  document.getElementById('unlock-type').value = 'STAT_HEALTH';
  document.getElementById('unlock-level').value = 1;
  document.getElementById('unlock-amount').value = 1;
  document.getElementById('unlock-target').value = '';
  document.getElementById('unlock-every-level').checked = false;
  document.getElementById('unlock-valuetype').value = 'FLAT';

  if (editIndex !== null && currentSkillIndex !== null) {
    const unlock = skills[currentSkillIndex].unlocks[editIndex];
    document.getElementById('unlock-type').value = unlock.type;
    document.getElementById('unlock-level').value = unlock.level;
    document.getElementById('unlock-amount').value = unlock.amount;
    document.getElementById('unlock-target').value = unlock.target || '';
    document.getElementById('unlock-every-level').checked = unlock.everyLevel || false;
    document.getElementById('unlock-valuetype').value = unlock.valueType || 'FLAT';
  }

  updateUnlockFields();
  new bootstrap.Modal(document.getElementById('unlockModal')).show();
}

function updateUnlockFields() {
  const type = document.getElementById('unlock-type').value;
  const targetGroup = document.getElementById('unlock-target-group');
  const valueTypeGroup = document.getElementById('unlock-valuetype-group');

  // Show target field only for ITEM type
  if (type === 'ITEM') {
    targetGroup.style.display = 'block';
  } else {
    targetGroup.style.display = 'none';
  }

  // Show valueType field only for stat types (not ITEM or MAGNET)
  if (type !== 'ITEM' && type !== 'MAGNET') {
    valueTypeGroup.style.display = 'block';
  } else {
    valueTypeGroup.style.display = 'none';
  }
}

function saveUnlock() {
  if (currentSkillIndex === null) return;

  const type = document.getElementById('unlock-type').value;
  const valueType = document.getElementById('unlock-valuetype').value;
  const isStatType = type !== 'ITEM' && type !== 'MAGNET';

  const unlock = {
    type: type,
    level: parseInt(document.getElementById('unlock-level').value) || 1,
    everyLevel: document.getElementById('unlock-every-level').checked,
    target: document.getElementById('unlock-target').value.trim(),
    amount: parseFloat(document.getElementById('unlock-amount').value) || 1
  };

  // Add percentage and valueType only for stat types
  if (isStatType) {
    unlock.percentage = valueType !== 'FLAT';
    unlock.valueType = valueType;
  }

  if (editingUnlockIndex !== null) {
    skills[currentSkillIndex].unlocks[editingUnlockIndex] = unlock;
  } else {
    skills[currentSkillIndex].unlocks.push(unlock);
  }

  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
  bootstrap.Modal.getInstance(document.getElementById('unlockModal')).hide();
  showToast(editingUnlockIndex !== null ? 'Unlock updated!' : 'Unlock added!');
}

function editUnlock(index) {
  openUnlockModal(index);
}

function deleteUnlock(index) {
  if (!confirm('Delete this unlock?')) return;
  skills[currentSkillIndex].unlocks.splice(index, 1);
  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
}

// Locked Items
function renderLockedItems(lockedItems) {
  if (!lockedItems || lockedItems.length === 0) {
    return '<p class="text-muted small">No locked items. Add items that require skill levels to use.</p>';
  }

  const len = lockedItems.length;
  return lockedItems.map((item, index) => `
    <div class="locked-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-locked">Level ${item.level}</span>
          <span class="ms-2">${item.itemId}</span>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary ${index === 0 ? 'disabled' : ''}" onclick="moveItem('lockedItem', ${index}, -1)" title="Move up">↑</button>
          <button class="btn btn-sm btn-outline-secondary ${index === len - 1 ? 'disabled' : ''}" onclick="moveItem('lockedItem', ${index}, 1)" title="Move down">↓</button>
          <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Copy to another skill">Copy</button>
            <ul class="dropdown-menu dropdown-menu-dark">
              ${getSkillsDropdownFor('lockedItem', index)}
            </ul>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="editLockedItem(${index})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLockedItem(${index})">X</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openLockedItemModal(editIndex = null) {
  editingLockedItemIndex = editIndex;

  document.getElementById('locked-item-id').value = '';
  document.getElementById('locked-item-level').value = 1;

  if (editIndex !== null && currentSkillIndex !== null) {
    const item = skills[currentSkillIndex].lockedItems[editIndex];
    document.getElementById('locked-item-id').value = item.itemId;
    document.getElementById('locked-item-level').value = item.level;
  }

  new bootstrap.Modal(document.getElementById('lockedItemModal')).show();
}

function saveLockedItem() {
  if (currentSkillIndex === null) return;

  const itemId = document.getElementById('locked-item-id').value.trim();
  if (!itemId) {
    showToast('Please enter an item ID', 'error');
    return;
  }

  const lockedItem = {
    itemId: itemId,
    level: parseInt(document.getElementById('locked-item-level').value) || 1
  };

  if (editingLockedItemIndex !== null) {
    skills[currentSkillIndex].lockedItems[editingLockedItemIndex] = lockedItem;
  } else {
    skills[currentSkillIndex].lockedItems.push(lockedItem);
  }

  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
  bootstrap.Modal.getInstance(document.getElementById('lockedItemModal')).hide();
  showToast(editingLockedItemIndex !== null ? 'Locked item updated!' : 'Locked item added!');
}

function editLockedItem(index) {
  openLockedItemModal(index);
}

function deleteLockedItem(index) {
  if (!confirm('Delete this locked item?')) return;
  skills[currentSkillIndex].lockedItems.splice(index, 1);
  saveToLocalStorage();
  renderSkillEditor();
  renderSkillsList();
  updateJSONPreview();
}

// JSON Preview
function updateJSONPreview() {
  const preview = document.getElementById('json-preview');
  preview.textContent = JSON.stringify(skills, null, 2);
}

function copyJSON() {
  const json = JSON.stringify(skills, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showToast('JSON copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Import/Export
function importJSON() {
  document.getElementById('import-file').click();
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        skills = imported;
      } else if (typeof imported === 'object') {
        // Handle single skill object
        skills = [imported];
      } else {
        throw new Error('Invalid format');
      }
      saveToLocalStorage();
      currentSkillIndex = skills.length > 0 ? 0 : null;
      renderSkillsList();
      if (currentSkillIndex !== null) {
        renderSkillEditor();
      }
      updateJSONPreview();
      showToast(`Imported ${skills.length} skill(s)!`);
    } catch (err) {
      showToast('Invalid JSON file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

function exportJSON() {
  const json = JSON.stringify(skills, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skills.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('skills.json downloaded!');
}

// Handle Enter key in list inputs
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (e.target.id === 'trigger-allow-input') {
      e.preventDefault();
      addToTriggerList('allow');
    } else if (e.target.id === 'trigger-deny-input') {
      e.preventDefault();
      addToTriggerList('deny');
    } else if (e.target.id === 'requirement-allow-input') {
      e.preventDefault();
      addToRequirementList('allow');
    } else if (e.target.id === 'requirement-deny-input') {
      e.preventDefault();
      addToRequirementList('deny');
    }
  }
});
