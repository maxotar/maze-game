const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const columns = 16;
const rows = 8;
const width = window.innerWidth;
const height = window.innerHeight;
const unitWidth = width / columns;
const unitHeight = height / rows;
const wallThickness = 10;
const maxVelocity = 25;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width: width,
    height: height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

const grid = Array(rows)
  .fill(null)
  .map(() => Array(columns).fill(false));

const verticals = Array(rows)
  .fill(null)
  .map(() => Array(columns - 1).fill(false));

const horizontals = Array(rows - 1)
  .fill(null)
  .map(() => Array(columns).fill(false));

function traverse(row, column) {
  // if cell already visited return
  if (grid[row][column]) {
    return;
  }

  // mark cell as visited
  grid[row][column] = true;

  // assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // check if neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= rows ||
      nextColumn < 0 ||
      nextColumn >= columns
    ) {
      continue;
    }

    // check it neighbor has been visited
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // remove wall between current cell and neighbor
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }

    // traverse neighbor
    traverse(nextRow, nextColumn);
  }
}

const startRow = Math.floor(Math.random() * rows);
const startColumn = Math.floor(Math.random() * columns);
traverse(startRow, startColumn);

horizontals.forEach((row, iRow) => {
  row.forEach((open, iCol) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      unitWidth * iCol + unitWidth / 2,
      unitHeight * iRow + unitHeight,
      unitWidth + wallThickness / 2,
      wallThickness,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );

    World.add(world, wall);
  });
});

verticals.forEach((row, iRow) => {
  row.forEach((open, iCol) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      unitWidth * iCol + unitWidth,
      unitHeight * iRow + unitHeight / 2,
      wallThickness,
      unitHeight + wallThickness / 2,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );

    World.add(world, wall);
  });
});

const walls = [
  Bodies.rectangle(width / 2, 0, width, wallThickness, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, wallThickness, { isStatic: true }),
  Bodies.rectangle(0, height / 2, wallThickness, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, wallThickness, height, {
    isStatic: true,
  }),
];
World.add(world, walls);

const goal = Bodies.rectangle(
  width - unitWidth / 2,
  height - unitHeight / 2,
  Math.min(unitWidth, unitHeight) * 0.7,
  Math.min(unitWidth, unitHeight) * 0.7,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "gold",
    },
  }
);
World.add(world, goal);

const ball = Bodies.circle(
  unitWidth / 2,
  unitHeight / 2,
  Math.min(unitWidth, unitHeight) / 4,
  {
    label: "ball",
    friction: 0,
    frictionAir: 0,
    render: {
      fillStyle: "aqua",
    },
  }
);
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  let { x, y } = ball.velocity;
  x = clamp(x, -maxVelocity, maxVelocity);
  y = clamp(y, -maxVelocity, maxVelocity);

  const deltaV = Math.max(Math.min(unitWidth, unitHeight) / 8, 8);

  if (event.key === "w" || event.key === "ArrowUp") {
    Body.setVelocity(ball, { x: x, y: y - deltaV });
  }

  if (event.key === "s" || event.key === "ArrowDown") {
    Body.setVelocity(ball, { x: x, y: y + deltaV });
  }

  if (event.key === "a" || event.key === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - deltaV, y: y });
  }

  if (event.key === "d" || event.key === "ArrowRight") {
    Body.setVelocity(ball, { x: x + deltaV, y: y });
  }
});

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
