export const starting = ["fire", "water", "earth", "air"];

export const recipes = {
  // Basic natural phenomena
  "fire+water": "steam",
  "fire+earth": "lava",
  "fire+air": "smoke",
  "water+earth": "mud",
  "water+air": "rain",
  "earth+air": "dust",

  // Weather and environment
  "steam+air": "cloud",
  "rain+earth": "plant",
  "lava+water": "stone",
  "plant+mud": "swamp",
  "plant+water": "life",
  "life+earth": "animal",

  // Human and civilization
  "animal+tools": "human",
  "human+house": "family",
  "human+tools": "worker",
  "family+wall": "village",
  "village+plant": "farm",
  "village+wall": "city",
  "city+plant": "park",
  "city+water": "port",

  // Tools and technology
  "stone+fire": "metal",
  "stone+metal": "tools",
  "tools+plant": "wood",
  "tools+stone": "brick",
  "brick+stone": "wall",
  "wall+wood": "house",
  "house+family": "home",
  "tools+metal": "machine",
  "cloud+metal": "electricity",
  "electricity+machine": "robot",
  "metal+fire": "sword",

  // Progression and advanced
  "farm+tools": "food",
  "food+human": "strength",
  "worker+brick": "builder",
  "builder+house": "home",
  "plant+life": "fruit",
  "sword+human": "warrior",
  "warrior+city": "army",
  "army+city": "empire",
};
