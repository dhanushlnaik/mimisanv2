import cron from 'node-cron';
import { query } from '../database/index.js';
import { logger } from '../utils/logger.js';

export function initSalaryScheduler(): void {
    // Daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running daily salary job');
        await processDailySalaries();
    });

    // Weekly on Sunday midnight (00:00)
    cron.schedule('0 0 * * 0', async () => {
        logger.info('Running weekly global salary job');
        await processWeeklySalaries();
    });

    logger.info('Salary scheduler initialized');
}

export async function processDailySalaries(): Promise<void> {
    try {
        const result = await query('SELECT * FROM server_configs');
        logger.info(`Processing daily salaries for ${result.rows.length} guilds`);

        for (const config of result.rows) {
            try {
                // @ts-ignore - config is typed as any from rows
                await payGuildSalary(config);
            } catch (err) {
                // @ts-ignore
                logger.error(`Failed to pay salary for guild ${config.guild_id}:`, err);
            }
        }
    } catch (error) {
        logger.error('Error in processDailySalaries:', error);
    }
}

async function payGuildSalary(config: any): Promise<void> {
    if (config.salary_mode === 'tiered' && config.salary_data) {
        const data = config.salary_data;
        // Iterate tiers
        // Format of salary_data: { "1-10": 50, "11-20": 100 } keys are strings range
        for (const [range, amount] of Object.entries(data)) {
            const [minStr, maxStr] = range.split('-');
            const min = parseInt(minStr);
            const max = parseInt(maxStr);

            if (isNaN(min) || isNaN(max)) continue;

            await query(`
                UPDATE user_currency uc
                SET balance = balance + $1
                FROM user_levels ul
                WHERE uc.user_id = ul.user_id AND uc.guild_id = ul.guild_id
                AND uc.guild_id = $2
                AND ul.level BETWEEN $3 AND $4
            `, [amount, config.guild_id, min, max]);
        }
    } else {
        // Linear: level * base. Default base is 50.
        const base = config.salary_base || 50;
        await query(`
            UPDATE user_currency uc
            SET balance = balance + (ul.level * $1)
            FROM user_levels ul
            WHERE uc.user_id = ul.user_id AND uc.guild_id = ul.guild_id
            AND uc.guild_id = $2
        `, [base, config.guild_id]);
    }
}

export async function processWeeklySalaries(): Promise<void> {
    try {
        // Global Formula: level^1.15 * 100
        const constant = 100;

        // This query updates all users at once
        await query(`
            UPDATE users_global
            SET balance = balance + (POWER(global_level, 1.15) * $1)::bigint,
                total_earnings = total_earnings + (POWER(global_level, 1.15) * $1)::bigint,
                last_weekly_at = NOW()
        `, [constant]);

        logger.info('Paid weekly global salaries');
    } catch (error) {
        logger.error('Error in processWeeklySalaries:', error);
    }
}
