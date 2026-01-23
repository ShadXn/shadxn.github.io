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
let allEntities = [];
let allItems = [];
let allBlocks = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  loadFromLocalStorage();
  renderSkillsList();
  updateJSONPreview();
  setupAutocomplete();
});

// Load game data
async function loadGameData() {
  try {
    const response = await fetch('game_data.json');
    gameData = await response.json();

    // Flatten entities
    allEntities = [];
    for (const category in gameData.entities) {
      allEntities.push(...gameData.entities[category]);
    }
    allEntities = [...new Set(allEntities)].sort();

    // Flatten items
    allItems = [];
    for (const category in gameData.items) {
      allItems.push(...gameData.items[category]);
    }
    allItems = [...new Set(allItems)].sort();

    // Flatten blocks
    allBlocks = [];
    for (const category in gameData.blocks) {
      allBlocks.push(...gameData.blocks[category]);
    }
    allBlocks = [...new Set(allBlocks)].sort();

    console.log(`Loaded ${allEntities.length} entities, ${allItems.length} items, ${allBlocks.length} blocks`);
  } catch (err) {
    console.error('Failed to load game data:', err);
    gameData = { entities: {}, items: {}, blocks: {} };
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

  container.innerHTML = skills.map((skill, index) => `
    <div class="skill-item p-3 rounded mb-2 ${currentSkillIndex === index ? 'active' : ''}" onclick="selectSkill(${index})">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${skill.displayName || 'Unnamed Skill'}</strong>
          <div class="small text-muted">ID: ${skill.id}</div>
          <div class="small mt-1">
            <span class="badge badge-trigger me-1">${skill.triggers?.length || 0} triggers</span>
            <span class="badge badge-unlock me-1">${skill.unlocks?.length || 0} unlocks</span>
            <span class="badge badge-locked me-1">${skill.lockedItems?.length || 0} locked</span>
          </div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); duplicateSkill(${index})" title="Duplicate skill">Dup</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteSkill(${index})">X</button>
        </div>
      </div>
    </div>
  `).join('');
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
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="section-header mb-0">Requirements</h6>
        <button class="btn btn-sm btn-primary" onclick="openRequirementModal()">+ Add Requirement</button>
      </div>
      <div id="requirements-container">
        ${renderRequirements(skill.requirements)}
      </div>
    </div>

    <!-- Triggers -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="section-header mb-0">Triggers</h6>
        <button class="btn btn-sm btn-primary" onclick="openTriggerModal()">+ Add Trigger</button>
      </div>
      <div id="triggers-container">
        ${renderTriggers(skill.triggers)}
      </div>
    </div>

    <!-- Unlocks -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="section-header mb-0">Unlocks</h6>
        <button class="btn btn-sm btn-primary" onclick="openUnlockModal()">+ Add Unlock</button>
      </div>
      <div id="unlocks-container">
        ${renderUnlocks(skill.unlocks)}
      </div>
    </div>

    <!-- Locked Items -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="section-header mb-0">Locked Items</h6>
        <button class="btn btn-sm btn-primary" onclick="openLockedItemModal()">+ Add Locked Item</button>
      </div>
      <div id="locked-items-container">
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

  return triggers.map((trigger, index) => `
    <div class="trigger-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-trigger">${trigger.type}</span>
          <span class="ms-2">+${trigger.xpReward} XP</span>
          ${trigger.cooldown > 0 ? `<span class="ms-2 text-muted small">(${trigger.cooldown}ms cooldown)</span>` : ''}
        </div>
        <div class="d-flex gap-1 flex-wrap">
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

// Requirements
function renderRequirements(requirements) {
  if (!requirements || requirements.length === 0) {
    return '<p class="text-muted small">No requirements. Add one to restrict when skill XP can be gained.</p>';
  }

  return requirements.map((req, index) => `
    <div class="requirement-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-requirement">${req.type}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editRequirement(${index})">Edit</button>
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

  return unlocks.map((unlock, index) => `
    <div class="unlock-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-unlock">${unlock.type}</span>
          <span class="ms-2">Level ${unlock.level}${unlock.everyLevel ? '+' : ''}</span>
          <span class="ms-2 text-muted">(+${unlock.amount})</span>
          ${unlock.target ? `<span class="ms-2 small">${unlock.target}</span>` : ''}
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editUnlock(${index})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUnlock(${index})">X</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openUnlockModal(editIndex = null) {
  editingUnlockIndex = editIndex;

  document.getElementById('unlock-type').value = 'STAT_HEALTH';
  document.getElementById('unlock-level').value = 1;
  document.getElementById('unlock-amount').value = 1;
  document.getElementById('unlock-target').value = '';
  document.getElementById('unlock-every-level').checked = false;

  if (editIndex !== null && currentSkillIndex !== null) {
    const unlock = skills[currentSkillIndex].unlocks[editIndex];
    document.getElementById('unlock-type').value = unlock.type;
    document.getElementById('unlock-level').value = unlock.level;
    document.getElementById('unlock-amount').value = unlock.amount;
    document.getElementById('unlock-target').value = unlock.target || '';
    document.getElementById('unlock-every-level').checked = unlock.everyLevel || false;
  }

  updateUnlockFields();
  new bootstrap.Modal(document.getElementById('unlockModal')).show();
}

function updateUnlockFields() {
  const type = document.getElementById('unlock-type').value;
  const targetGroup = document.getElementById('unlock-target-group');

  // Show target field only for ITEM type
  if (type === 'ITEM') {
    targetGroup.style.display = 'block';
  } else {
    targetGroup.style.display = 'none';
  }
}

function saveUnlock() {
  if (currentSkillIndex === null) return;

  const unlock = {
    type: document.getElementById('unlock-type').value,
    level: parseInt(document.getElementById('unlock-level').value) || 1,
    everyLevel: document.getElementById('unlock-every-level').checked,
    target: document.getElementById('unlock-target').value.trim(),
    amount: parseFloat(document.getElementById('unlock-amount').value) || 1
  };

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

  return lockedItems.map((item, index) => `
    <div class="locked-card p-3 rounded">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <span class="badge badge-locked">Level ${item.level}</span>
          <span class="ms-2">${item.itemId}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editLockedItem(${index})">Edit</button>
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
