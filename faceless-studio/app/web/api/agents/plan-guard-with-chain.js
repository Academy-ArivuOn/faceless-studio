// app/api/agents/plan-guard-with-chain.js
// Wraps guardAgent with session context injection for chained agents

import { guardAgent } from '@/packages/plan-guard';
import { getSessionContext, buildChainedContextBlock } from '@/packages/session-context';
import { getCreatorDNA, buildDNAContextBlock } from '@/packages/creator-dna';

export async function guardAgentWithContext(request, agentId) {
  const guard = await guardAgent(request, agentId);
  if (guard.blocked) return guard;

  // Enrich with DNA + chain context
  const sessionId = request.headers.get('x-session-id') || null;

  const [dna, sessionContext] = await Promise.all([
    getCreatorDNA(guard.user.id),
    sessionId ? getSessionContext(sessionId) : Promise.resolve(null),
  ]);

  return {
    ...guard,
    dnaBlock:   buildDNAContextBlock(dna),
    chainBlock: buildChainedContextBlock(sessionContext),
    dna,
    sessionId,
  };
}