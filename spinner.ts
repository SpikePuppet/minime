const frames = ["🤔", "🧠", "💭", "✨", "💡", "🔮", "⚡", "🌟"];

let intervalId: Timer | null = null;
let frameIndex = 0;

export function startSpinner(text = "Thinking") {
  frameIndex = 0;
  process.stdout.write(`\n${frames[frameIndex]}  ${text}...`);

  intervalId = setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    process.stdout.write(`\r${frames[frameIndex]}  ${text}...`);
  }, 200);
}

export function stopSpinner() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  process.stdout.write("\r\x1b[K");
}
