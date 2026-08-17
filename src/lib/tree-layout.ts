import type { CastEdge, CastNode } from "@/types/cast";

export const NODE_W = 132;
export const NODE_H = 120;
export const COL_GAP = 108;
export const ROW_GAP = 26;

export interface PositionedNode extends CastNode {
  x: number;
  y: number;
  children: string[];
}

export interface Layout {
  nodes: PositionedNode[];
  byHash: Map<string, PositionedNode>;
  width: number;
  height: number;
}

/**
 * Tidy left-to-right tree layout: root at the left, descendants fan out by
 * depth. Pure function — reusable and independent of the rendering layer.
 */
export function layoutTree(nodes: CastNode[], edges: CastEdge[], rootHash: string): Layout {
  const childMap = new Map<string, string[]>();
  for (const edge of edges) {
    const list = childMap.get(edge.parentHash) ?? [];
    list.push(edge.childHash);
    childMap.set(edge.parentHash, list);
  }

  const source = new Map(nodes.map((n) => [n.hash, n]));
  const positioned = new Map<string, PositionedNode>();
  let cursor = 0;

  const rowStep = NODE_H + ROW_GAP;
  const colStep = NODE_W + COL_GAP;

  const walk = (hash: string, depth: number, seen: Set<string>): number => {
    const node = source.get(hash);
    if (!node || seen.has(hash)) return cursor * rowStep;
    seen.add(hash);

    const kids = (childMap.get(hash) ?? []).filter((k) => source.has(k) && !seen.has(k));
    let y: number;
    if (kids.length === 0) {
      y = cursor * rowStep;
      cursor += 1;
    } else {
      const ys = kids.map((kid) => walk(kid, depth + 1, seen));
      y = (Math.min(...ys) + Math.max(...ys)) / 2;
    }

    positioned.set(hash, {
      ...node,
      depth,
      x: depth * colStep,
      y,
      children: kids,
    });
    return y;
  };

  const seen = new Set<string>();
  if (source.has(rootHash)) walk(rootHash, 0, seen);
  // Any orphaned nodes (parent never resolved) still get placed.
  for (const node of nodes) {
    if (!positioned.has(node.hash)) walk(node.hash, node.depth, seen);
  }

  const list = [...positioned.values()];
  const maxX = list.reduce((m, n) => Math.max(m, n.x), 0);
  const maxY = list.reduce((m, n) => Math.max(m, n.y), 0);

  return {
    nodes: list,
    byHash: positioned,
    width: maxX + NODE_W,
    height: maxY + NODE_H,
  };
}

/** Chain of hashes from the given node back up to the root, inclusive. */
export function ancestorPath(byHash: Map<string, PositionedNode>, hash: string): string[] {
  const path: string[] = [];
  let current: string | null = hash;
  const guard = new Set<string>();
  while (current && !guard.has(current)) {
    guard.add(current);
    path.push(current);
    current = byHash.get(current)?.parentHash ?? null;
  }
  return path;
}
