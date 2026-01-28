import json
from collections import OrderedDict

# Load your real JSON file
with open("daily_clue_progression.json", "r", encoding="utf-8") as f:
    data = json.load(f)

updated_data = []

for entry in data:
    new_entry = OrderedDict()
    for key, value in entry.items():
        new_entry[key] = value
        if key == "done_elite":
            new_entry["done_master"] = 0  # Insert after "done_elite"
    updated_data.append(new_entry)

# Save the updated JSON
with open("daily_clue_progression_updated.json", "w", encoding="utf-8") as f:
    json.dump(updated_data, f, indent=2, ensure_ascii=False)

print("✅ 'done_master': 0 added after 'done_elite' in all entries.")