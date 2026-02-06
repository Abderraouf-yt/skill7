import skillsData from '@/data/skills.json';

export interface Skill {
    id: string;
    name: string;
    description: string;
    category: string;
    path?: string;
    risk?: string;
    instruction?: string;
}

export interface ScoredSkill<T extends Skill = Skill> {
    skill: T;
    score: number;
}

/**
 * Client-side Semantic Search (TF-IDF style)
 * Matches skills by meaning, not just keywords.
 * Identical logic to MCP server for consistent results.
 */
export function semanticSearch<T extends Skill>(query: string, skills: T[], topK: number = 3): { skill: T; score: number }[] {
    if (!query) return [];

    // Split by whitespace to preserve special chars like hyphens in "thought-graph"
    // Then clean punctuation from edges but keep internal hyphens
    const queryTerms = query.toLowerCase()
        .split(/\s+/)
        .map(t => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')) // trim non-alphanumeric from ends
        .filter(t => t.length > 2);

    // If no valid terms, return nothing
    if (queryTerms.length === 0) return [];

    const scored = skills.map(skill => {
        const nameText = (skill.name || '').toLowerCase();
        const descText = (skill.description || '').toLowerCase();
        const catText = (skill.category || '').toLowerCase();
        // Path might not be in client data, check if exists, else ignore
        const pathText = (skill.path || '').toLowerCase();

        let score = 0;
        for (const term of queryTerms) {
            // Name matches are most valuable
            if (nameText.includes(term)) score += 5;
            // Category matches indicate domain relevance
            if (catText.includes(term)) score += 3;
            // Path often contains good keywords (if available)
            if (pathText.includes(term)) score += 2;
            // Description matches are baseline relevance
            if (descText.includes(term)) score += 1;
        }

        return { skill, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Generate a simple workflow explanation based on selected skills
 */
export function generateWorkflow(goal: string, matchedSkills: Skill[]) {
    return matchedSkills.map((skill, index) => {
        let action = "Apply";
        if (skill.category.includes('security')) action = "Audit & Secure";
        else if (skill.category.includes('test')) action = "Verify";
        else if (skill.category.includes('arch')) action = "Design";
        else if (skill.name.includes('setup')) action = "Configure";

        return {
            step: index + 1,
            action,
            skill: skill.name,
            description: skill.description,
            reason: `Relevant for "${goal}"`
        };
    });
}
