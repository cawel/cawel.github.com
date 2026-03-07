export const starting = ["fire", "water", "earth", "air"];

export const recipes = {
  // Basic natural phenomena
  "fire+water": "steam",
  "earth+fire": "lava",
  "air+fire": "smoke",
  "earth+water": "mud",
  "air+water": "rain",
  "air+earth": "dust",

  // Weather and environment
  "air+steam": "cloud",
  "earth+rain": "plant",
  "lava+water": "stone",
  "mud+plant": "swamp",
  "plant+water": "life",
  "earth+life": "animal",

  // Human and civilization
  "animal+tools": "human",
  "house+human": "family",
  "human+tools": "worker",
  "family+wall": "village",
  "plant+village": "farm",
  "village+wall": "city",
  "city+plant": "park",
  "city+water": "port",

  // Tools and technology
  "fire+stone": "metal",
  "metal+stone": "tools",
  "plant+tools": "wood",
  "stone+tools": "brick",
  "brick+stone": "wall",
  "wall+wood": "house",
  "family+house": "home",
  "metal+tools": "machine",
  "cloud+metal": "electricity",
  "electricity+machine": "robot",
  "fire+metal": "sword",

  // Progression and advanced
  "farm+tools": "food",
  "food+human": "strength",
  "brick+worker": "builder",
  "builder+house": "home",
  "life+plant": "fruit",
  "human+sword": "warrior",
  "city+warrior": "army",
  "army+city": "empire",
};
