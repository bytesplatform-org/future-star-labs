/**
 * The page's boot gate. Anything that has to be ready before the page is
 * seen (fonts, the hero's GL type) registers a task; the loader waits for
 * every task to settle, then finishes the boot. Whatever should only begin
 * once the page is shown — entrances, pointer trails — waits on onBootDone.
 *
 * On pages without a loader nothing is gated: finishBoot runs at once.
 */

const tasks: Promise<unknown>[] = [];
let settled = 0;
let finished = false;
let resolveDone!: () => void;
const done = new Promise<void>(r => { resolveDone = r; });

/** Registers work the loader should wait for; failures count as settled. */
export function bootTask<T>(work: Promise<T>): Promise<T> {
  if (!finished) {
    tasks.push(work);
    const settle = () => { settled += 1; };
    work.then(settle, settle);
  }
  return work;
}

export function bootProgress() {
  return { settled, total: tasks.length };
}

export function isBooted() {
  return finished;
}

export function finishBoot() {
  if (finished) return;
  finished = true;
  resolveDone();
}

/** Runs fn once the page has been shown (at once if it already has). */
export function onBootDone(fn: () => void): () => void {
  let live = true;
  void done.then(() => { if (live) fn(); });
  return () => { live = false; };
}
