import { EDITIONS, getEdition } from './editions.js';

export const EDITION_REGISTRY_KEY = 'selectedEdition';

export function selectEdition(registry, id) {
  const edition = getEdition(id);
  registry.set(EDITION_REGISTRY_KEY, edition.id);
  return edition;
}

export function selectedEdition(registry) {
  const id = registry.get(EDITION_REGISTRY_KEY);
  return EDITIONS[id] ?? EDITIONS.mountain;
}
