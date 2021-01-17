function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function shuffle(arr) {
  let counter = arr.length;
  while (counter) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    [arr[counter], arr[index]] = [arr[index], arr[counter]];
  }
  return arr;
}
