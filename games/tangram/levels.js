// Predefined Tangram Puzzle Levels
// The positions (x, y) are based on a 600x600 board space.
// Target shapes are drawn dynamically by combining the piece shapes in their solved positions.

const BUILT_IN_LEVELS = [
  {
    id: "square",
    name: "The Classic Square",
    difficulty: "Beginner",
    description: "Form the perfect square that contains all 7 pieces.",
    pieces: [
      { name: "LT1", x: 300, y: 220, rotation: 0, flipped: false },
      { name: "LT2", x: 220, y: 300, rotation: 270, flipped: false },
      { name: "MT", x: 380, y: 380, rotation: 0, flipped: false },
      { name: "SQ", x: 360, y: 300, rotation: 0, flipped: false },
      { name: "ST1", x: 400, y: 240, rotation: 90, flipped: false },
      { name: "ST2", x: 320, y: 360, rotation: 270, flipped: false },
      { name: "PL", x: 270, y: 390, rotation: 0, flipped: false }
    ]
  },
  {
    id: "triangle",
    name: "The Giant Triangle",
    difficulty: "Beginner",
    description: "Arrange all pieces into a single large right-angled triangle.",
    pieces: [
      { name: "LT1", x: 180, y: 380, rotation: 180, flipped: false },
      { name: "LT2", x: 420, y: 380, rotation: 180, flipped: false },
      { name: "MT", x: 300, y: 260, rotation: 180, flipped: false },
      { name: "SQ", x: 300, y: 360, rotation: 0, flipped: false },
      { name: "ST1", x: 240, y: 320, rotation: 90, flipped: false },
      { name: "ST2", x: 360, y: 320, rotation: 270, flipped: false },
      { name: "PL", x: 300, y: 320, rotation: 0, flipped: true }
    ]
  },
  {
    id: "house",
    name: "The Cozy Cottage",
    difficulty: "Intermediate",
    description: "Construct a house with a steep roof and a small chimney.",
    pieces: [
      { name: "LT1", x: 300, y: 220, rotation: 180, flipped: false },
      { name: "LT2", x: 300, y: 340, rotation: 0, flipped: false },
      { name: "MT", x: 420, y: 380, rotation: 270, flipped: false },
      { name: "SQ", x: 210, y: 390, rotation: 0, flipped: false },
      { name: "ST1", x: 150, y: 330, rotation: 90, flipped: false },
      { name: "ST2", x: 210, y: 330, rotation: 270, flipped: false },
      { name: "PL", x: 390, y: 230, rotation: 90, flipped: false }
    ]
  },
  {
    id: "swan",
    name: "The Graceful Swan",
    difficulty: "Advanced",
    description: "Assemble the majestic swan gliding across the water.",
    pieces: [
      { name: "LT1", x: 240, y: 360, rotation: 135, flipped: false },
      { name: "LT2", x: 325, y: 275, rotation: 225, flipped: false },
      { name: "MT", x: 240, y: 220, rotation: 45, flipped: false },
      { name: "SQ", x: 410, y: 190, rotation: 0, flipped: false },
      { name: "ST1", x: 325, y: 165, rotation: 135, flipped: false },
      { name: "ST2", x: 410, y: 105, rotation: 45, flipped: false },
      { name: "PL", x: 268, y: 138, rotation: 135, flipped: true }
    ]
  },
  {
    id: "sailboat",
    name: "The Windcatcher",
    difficulty: "Intermediate",
    description: "Form a classic sailboat skimming the ocean waves.",
    pieces: [
      { name: "LT1", x: 260, y: 240, rotation: 90, flipped: false },
      { name: "LT2", x: 380, y: 240, rotation: 0, flipped: false },
      { name: "MT", x: 260, y: 390, rotation: 180, flipped: false },
      { name: "SQ", x: 380, y: 360, rotation: 0, flipped: false },
      { name: "ST1", x: 320, y: 300, rotation: 90, flipped: false },
      { name: "ST2", x: 440, y: 420, rotation: 270, flipped: false },
      { name: "PL", x: 170, y: 390, rotation: 0, flipped: false }
    ]
  },
  {
    id: "candle",
    name: "The Shining Candle",
    difficulty: "Advanced",
    description: "Recreate a candle in a holder with a flickering flame.",
    pieces: [
      { name: "LT1", x: 300, y: 340, rotation: 45, flipped: false },
      { name: "LT2", x: 300, y: 220, rotation: 225, flipped: false },
      { name: "MT", x: 300, y: 100, rotation: 135, flipped: false },
      { name: "SQ", x: 300, y: 440, rotation: 0, flipped: false },
      { name: "ST1", x: 215, y: 415, rotation: 45, flipped: false },
      { name: "ST2", x: 385, y: 415, rotation: 315, flipped: false },
      { name: "PL", x: 300, y: 490, rotation: 90, flipped: false }
    ]
  },
  {
    id: "arrow",
    name: "The Direct Arrow",
    difficulty: "Intermediate",
    description: "Assemble a perfect pointing arrow indicating the way.",
    pieces: [
      { name: "LT1", x: 260, y: 300, rotation: 45, flipped: false },
      { name: "LT2", x: 380, y: 300, rotation: 315, flipped: false },
      { name: "MT", x: 320, y: 180, rotation: 180, flipped: false },
      { name: "SQ", x: 320, y: 420, rotation: 0, flipped: false },
      { name: "ST1", x: 260, y: 420, rotation: 90, flipped: false },
      { name: "ST2", x: 380, y: 420, rotation: 270, flipped: false },
      { name: "PL", x: 320, y: 480, rotation: 0, flipped: false }
    ]
  }
];
