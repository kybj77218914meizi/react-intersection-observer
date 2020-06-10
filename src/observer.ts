import ReactIntersectionObserver, { TargetNode } from './IntersectionObserver';
import { parseRootMargin, shallowCompare } from './utils';

export const observerElementsMap = new Map();

export function getPooled(options: IntersectionObserverInit = {}) {
  const root = options.root || null;
  const rootMargin = parseRootMargin(options.rootMargin);
  const threshold = Array.isArray(options.threshold)
    ? options.threshold
    : [options.threshold != null ? options.threshold : 0];
  const observers = observerElementsMap.keys();
  let observer;
  while ((observer = observers.next().value)) {
    const unmatched =
      root !== observer.root ||
      rootMargin !== observer.rootMargin ||
      shallowCompare(threshold, observer.thresholds);

    if (!unmatched) {
      return observer;
    }
  }
  return null;
}

export function findObserverElement(
  observer: IntersectionObserver,
  entry: IntersectionObserverEntry
) {
  const elements = observerElementsMap.get(observer);
  if (elements) {
    const values = elements.values();
    let element: ReactIntersectionObserver;
    while ((element = values.next().value)) {
      if (element.target === entry.target) {
        return element;
      }
    }
  }
  return null;
}

/**
 * The Intersection Observer API callback that is called whenever one element
 * – namely the target – intersects either the device viewport or a specified element.
 * Also will get called whenever the visibility of the target element changes and
 * crosses desired amounts of intersection with the root.
 */
export function callback(
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) {
  for (let i = 0; i < entries.length; i++) {
    const element = findObserverElement(observer, entries[i]);
    if (element) {
      element.handleChange(entries[i]);
    }
  }
}

export function createObserver(options: IntersectionObserverInit) {
  return getPooled(options) || new IntersectionObserver(callback, options);
}

export function observeElement(element: ReactIntersectionObserver) {
  if (!observerElementsMap.has(element.observer)) {
    observerElementsMap.set(element.observer, new Set());
  }
  observerElementsMap.get(element.observer).add(element);
  element.observer!.observe(element.target!);
}

export function unobserveElement(
  element: ReactIntersectionObserver,
  target: TargetNode
) {
  if (observerElementsMap.has(element.observer)) {
    const targets = observerElementsMap.get(element.observer);
    if (targets.delete(element)) {
      if (targets.size > 0) {
        element.observer!.unobserve(target);
      } else {
        element.observer!.disconnect();
        observerElementsMap.delete(element.observer);
      }
    }
  }
}