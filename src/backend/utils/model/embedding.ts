import {AzureOpenAIEmbeddings} from "@langchain/openai";


const AZURE_OPENAI_API_ENDPOINT = process.env.AZURE_AI_FOUNDRY_API_OPENAI_ENDPOINT!;
const AZURE_OPENAI_API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview"
const AZURE_OPENAI_API_INSTANCE_NAME = process.env.AZURE_OPENAI_API_INSTANCE_NAME!


const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiInstanceName: AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
    azureOpenAIEndpoint: AZURE_OPENAI_API_ENDPOINT,
    azureOpenAIApiEmbeddingsDeploymentName: "text-embedding-3-small",
    azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
});

export async function embeddingQuery(text: string): Promise<number[]> {
    return await embeddings.embedQuery(text)
}

export async function embeddingDocuments(texts: string[]): Promise<number[][]> {
    return await embeddings.embedDocuments(texts)
}
