import { WorkerKind } from '../workers.js'

export const allowedTargetKinds: Record<WorkerKind, WorkerKind[]> = {
  [WorkerKind.Indexer]: [WorkerKind.Fetcher, WorkerKind.Parser],
  [WorkerKind.Fetcher]: [
    WorkerKind.Indexer,
    WorkerKind.Fetcher,
    WorkerKind.Parser,
  ],
  [WorkerKind.Parser]: [WorkerKind.Indexer, WorkerKind.Fetcher],
  [WorkerKind.Main]: [],
}

export function isNodeIdAllowed(nodeID: string, targetNodeID: string): boolean {
  const sourceKind = getNodeKind(nodeID)
  if (!sourceKind) return false

  const targetKind = getNodeKind(targetNodeID)
  if (!targetKind) return false

  const allowedTargets = allowedTargetKinds[sourceKind]
  return allowedTargets.some((kind) => kind === targetKind)
}

export function getNodeKind(nodeID: string): WorkerKind | undefined {
  try {
    const [projectId, kind, instance] = nodeID.split('-')
    return kind as WorkerKind
  } catch (e) {
    console.log('NodeID with unknown kind', nodeID)
  }
}
