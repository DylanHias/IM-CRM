type EntityType = 'opportunity' | 'activity' | 'followup' | 'contact' | 'customer' | 'walkthrough';
type Action = 'created' | 'updated' | 'deleted' | 'completed';

interface DataEvent {
  entity: EntityType;
  action: Action;
  customerId?: string;
}

type Listener = (event: DataEvent) => void;

const listeners = new Set<Listener>();

export function emitDataEvent(entity: EntityType, action: Action, customerId?: string): void {
  const event: DataEvent = { entity, action, customerId };
  listeners.forEach((fn) => fn(event));
}

export function onDataEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
