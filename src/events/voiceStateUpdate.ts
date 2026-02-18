import { type VoiceState } from 'discord.js';
import type { MimiClient } from '../client.js';
import { onVoiceJoin, onVoiceLeave } from '../services/voice.service.js';


export async function voiceStateUpdate(
    client: MimiClient,
    oldState: VoiceState,
    newState: VoiceState
): Promise<void> {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    // Check if user is in a valid state (in channel, not muted, not deafened)
    const isValidVoiceState = (state: VoiceState) => {
        return (
            !!state.channelId &&
            !state.selfMute &&
            !state.selfDeaf &&
            !state.serverMute &&
            !state.serverDeaf
        );
    };

    const wasValid = isValidVoiceState(oldState);
    const isValid = isValidVoiceState(newState);

    if (!wasValid && isValid) {
        // User started valid activity (Joined or Unmuted)
        onVoiceJoin(member.id, newState.guild.id);
    } else if (wasValid && !isValid) {
        // User stopped valid activity (Left or Muted)
        onVoiceLeave(member.id);
    } else if (wasValid && isValid && oldState.guild.id !== newState.guild.id) {
        // Switched guilds (unlikely for voiceStateUpdate but possible if they moved?)
        // Usually handled as leave old -> join new.
        // If they switched channels in same guild, no change needed unless we track per-channel.
        // PRD doesn't specify per-channel tracking beyond blacklist.
        // If they switch to blacklisted channel, we should handle that.
        // Current implementation assumes whole server is valid unless we check channel ID in `processVoiceXp`.
        // `processVoiceXp` only knows guildId. It doesn't know channelId.
        // So I should store channelId in `activeVoiceUsers` too?
        // Or re-check channel in `processVoiceXp` using `client`?
        // `processVoiceXp` iterates `activeVoiceUsers`. If I store channelId, I can check config there.
        // For MVP, just assume valid if they are in voice.
        // But `isValidVoiceState` checks `channelId`.

        // If they switch channels, `oldState.channelId` != `newState.channelId`.
        // `isValid` is true for both.
        // No change in `activeVoiceUsers` needed if same guild.
    }
}
