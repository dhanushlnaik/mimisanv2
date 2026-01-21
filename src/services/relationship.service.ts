import { query } from '../database/index.js';
import type { Relationship, RelationshipState } from '../client.js';
import { logger } from '../utils/logger.js';

// Relationship state progression
const STATE_ORDER: RelationshipState[] = [
    'stranger',
    'acquaintance',
    'friend',
    'best_friend',
    'dating',
    'engaged',
    'married',
];

// Get relationship between two users
export async function getRelationship(
    guildId: string,
    userOne: string,
    userTwo: string
): Promise<Relationship | null> {
    // Always order user IDs to ensure consistent lookups
    const [u1, u2] = [userOne, userTwo].sort();

    const result = await query<Relationship>(
        `SELECT * FROM relationships 
     WHERE guild_id = $1 AND user_one_id = $2 AND user_two_id = $3`,
        [guildId, u1, u2]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
}

// Create or get relationship
export async function getOrCreateRelationship(
    guildId: string,
    userOne: string,
    userTwo: string
): Promise<Relationship> {
    const existing = await getRelationship(guildId, userOne, userTwo);
    if (existing) return existing;

    const [u1, u2] = [userOne, userTwo].sort();

    const result = await query<Relationship>(
        `INSERT INTO relationships (guild_id, user_one_id, user_two_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [guildId, u1, u2]
    );

    logger.debug(`Created relationship between ${u1} and ${u2} in guild ${guildId}`);
    return result.rows[0];
}

// Update relationship attributes
export async function updateRelationshipStats(
    relationshipId: number,
    changes: {
        trust?: number;
        affection?: number;
        stability?: number;
        reputation?: number;
    }
): Promise<Relationship> {
    const setClauses: string[] = [];
    const values: (number | string)[] = [];
    let paramIndex = 1;

    if (changes.trust !== undefined) {
        setClauses.push(`trust = GREATEST(0, LEAST(100, trust + $${paramIndex}))`);
        values.push(changes.trust);
        paramIndex++;
    }
    if (changes.affection !== undefined) {
        setClauses.push(`affection = GREATEST(0, LEAST(100, affection + $${paramIndex}))`);
        values.push(changes.affection);
        paramIndex++;
    }
    if (changes.stability !== undefined) {
        setClauses.push(`stability = GREATEST(0, LEAST(100, stability + $${paramIndex}))`);
        values.push(changes.stability);
        paramIndex++;
    }
    if (changes.reputation !== undefined) {
        setClauses.push(`reputation = reputation + $${paramIndex}`);
        values.push(changes.reputation);
        paramIndex++;
    }

    values.push(relationshipId);

    const result = await query<Relationship>(
        `UPDATE relationships SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
        values
    );

    // Log event
    await logRelationshipEvent(relationshipId, 'stats_change', changes);

    return result.rows[0];
}

// Update relationship state
export async function updateRelationshipState(
    relationshipId: number,
    newState: RelationshipState
): Promise<Relationship> {
    const result = await query<Relationship>(
        `UPDATE relationships SET relationship_state = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
        [relationshipId, newState]
    );

    await logRelationshipEvent(relationshipId, 'state_change', { newState });
    logger.debug(`Relationship ${relationshipId} state changed to ${newState}`);

    return result.rows[0];
}

// Progress relationship to next state
export async function progressRelationship(
    relationshipId: number
): Promise<Relationship | null> {
    const result = await query<Relationship>(
        'SELECT * FROM relationships WHERE id = $1',
        [relationshipId]
    );

    if (result.rows.length === 0) return null;

    const relationship = result.rows[0];
    const currentIndex = STATE_ORDER.indexOf(relationship.relationship_state);

    if (currentIndex === -1 || currentIndex >= STATE_ORDER.length - 1) {
        return relationship; // Already at max or in separated/divorced state
    }

    const nextState = STATE_ORDER[currentIndex + 1];
    return updateRelationshipState(relationshipId, nextState);
}

// Get all relationships for a user in a guild
export async function getUserRelationships(
    guildId: string,
    userId: string
): Promise<Relationship[]> {
    const result = await query<Relationship>(
        `SELECT * FROM relationships 
     WHERE guild_id = $1 AND (user_one_id = $2 OR user_two_id = $2)
     ORDER BY reputation DESC`,
        [guildId, userId]
    );

    return result.rows;
}

// Log relationship event
async function logRelationshipEvent(
    relationshipId: number,
    eventType: string,
    eventData: Record<string, unknown>
): Promise<void> {
    await query(
        `INSERT INTO relationship_events (relationship_id, event_type, event_data)
     VALUES ($1, $2, $3)`,
        [relationshipId, eventType, JSON.stringify(eventData)]
    );
}

// Propose to another user
export async function propose(
    guildId: string,
    proposerId: string,
    targetId: string
): Promise<{ success: boolean; error?: string; relationship?: Relationship }> {
    const rel = await getRelationship(guildId, proposerId, targetId);

    if (!rel) {
        return { success: false, error: 'No relationship exists' };
    }

    if (rel.relationship_state !== 'dating') {
        return { success: false, error: 'You must be dating to propose' };
    }

    if (rel.affection < 75 || rel.trust < 75) {
        return { success: false, error: 'Affection and trust must be at least 75' };
    }

    const updated = await updateRelationshipState(rel.id, 'engaged');
    return { success: true, relationship: updated };
}

// Get married
export async function marry(
    guildId: string,
    userOne: string,
    userTwo: string
): Promise<{ success: boolean; error?: string; relationship?: Relationship }> {
    const rel = await getRelationship(guildId, userOne, userTwo);

    if (!rel) {
        return { success: false, error: 'No relationship exists' };
    }

    if (rel.relationship_state !== 'engaged') {
        return { success: false, error: 'You must be engaged to marry' };
    }

    const updated = await updateRelationshipState(rel.id, 'married');
    return { success: true, relationship: updated };
}

// Divorce
export async function divorce(
    guildId: string,
    userOne: string,
    userTwo: string
): Promise<{ success: boolean; error?: string; relationship?: Relationship }> {
    const rel = await getRelationship(guildId, userOne, userTwo);

    if (!rel) {
        return { success: false, error: 'No relationship exists' };
    }

    if (rel.relationship_state !== 'married') {
        return { success: false, error: 'You must be married to divorce' };
    }

    // Apply penalties
    await updateRelationshipStats(rel.id, {
        trust: -30,
        affection: -30,
        stability: -50,
        reputation: -20,
    });

    const finalRel = await updateRelationshipState(rel.id, 'divorced');
    return { success: true, relationship: finalRel };
}
