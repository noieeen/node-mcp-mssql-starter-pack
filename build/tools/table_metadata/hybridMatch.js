import { z } from "zod";
import { advanceMatchMetadataHybrid } from "../../backend/advance-match-metadata-hybrid.js";
// interface QueryConfig {
//     question: string
//     relevance_threshold: number
//     max_results: number
//     max_retries?: number
//     min_match?: number
//     fallback_ratio?: number
// }
export function registerTableMetadataTool(server) {
    server.registerTool("metadata.get_table_columns_relationship_query_templates", {
        title: "Get table columns relationship and query templates",
        description: "Get BCRM table columns relationship and query templates",
        inputSchema: {
            question: z.string().min(3).describe("User's question"),
            relevance_threshold: z.number().min(0).max(1).default(0.5).describe("Relevance threshold"),
            max_results: z.number().min(1).max(100).default(10).describe("Maximum number of results"),
            max_retries: z.number().min(1).max(10).default(5).describe("Maximum number of retries"),
            min_match: z.number().min(0).max(1).default(0.5).describe("Minimum match threshold"),
            fallback_ratio: z.number().min(0).max(1).default(0.5).describe("Fallback ratio"),
        },
    }, async ({ question, relevance_threshold, max_results, max_retries, min_match, fallback_ratio }) => {
        try {
            const metadataMatches = await advanceMatchMetadataHybrid({
                question,
                relevance_threshold,
                max_results,
                max_retries,
                min_match,
                fallback_ratio
            });
            // Format the response as expected by MCP
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(metadataMatches, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error during hybrid match: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
}
