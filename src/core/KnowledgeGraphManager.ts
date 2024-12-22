// src/core/KnowledgeGraphManager.ts

import {JsonLineStorage} from './storage/JsonLineStorage.js';
import {ManagerFactory} from './managers/ManagerFactory.js';
import type {Node, Edge, Graph} from '../types/graph.js';
import type {
    MetadataAddition,
    MetadataDeletion,
    EdgeFilter,
    MetadataResult,
    GetEdgesResult,
    OpenNodesResult
} from '../types/index.js';
import type {
    INodeManager,
    IEdgeManager,
    IMetadataManager,
    ISearchManager,
    ITransactionManager
} from '../types/managers.js';
import type {IStorage} from '../types/storage.js';

/**
 * Manages operations related to the knowledge graph, including adding, updating,
 * deleting nodes and edges, as well as handling metadata and search functionalities.
 */
export class KnowledgeGraphManager {
    private readonly storage: IStorage;
    private readonly nodeManager: INodeManager;
    private readonly edgeManager: IEdgeManager;
    private readonly metadataManager: IMetadataManager;
    private readonly searchManager: ISearchManager;
    private readonly transactionManager: ITransactionManager;

    /**
     * Creates an instance of KnowledgeGraphManager.
     */
    constructor(storage: IStorage = new JsonLineStorage()) {
        this.storage = storage;
        this.nodeManager = ManagerFactory.createNodeManager(this.storage);
        this.edgeManager = ManagerFactory.createEdgeManager(this.storage);
        this.metadataManager = ManagerFactory.createMetadataManager(this.storage);
        this.searchManager = ManagerFactory.createSearchManager(this.storage);
        this.transactionManager = ManagerFactory.createTransactionManager(this.storage);
    }

    /**
     * Begins a new transaction.
     */
    async beginTransaction(): Promise<void> {
        return this.transactionManager.beginTransaction();
    }

    /**
     * Commits the current transaction.
     */
    async commit(): Promise<void> {
        return this.transactionManager.commit();
    }

    /**
     * Rolls back the current transaction.
     */
    async rollback(): Promise<void> {
        return this.transactionManager.rollback();
    }

    /**
     * Executes an operation within a transaction and handles commit/rollback.
     */
    async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
        await this.beginTransaction();
        try {
            const result = await operation();
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    /**
     * Adds a rollback action to the current transaction.
     */
    async addRollbackAction(action: () => Promise<void>, description: string): Promise<void> {
        return this.transactionManager.addRollbackAction(action, description);
    }

    /**
     * Adds new nodes to the knowledge graph.
     */
    async addNodes(nodes: Node[]): Promise<Node[]> {
        return this.nodeManager.addNodes(nodes);
    }

    /**
     * Updates existing nodes in the knowledge graph.
     */
    async updateNodes(nodes: Partial<Node>[]): Promise<Node[]> {
        return this.nodeManager.updateNodes(nodes);
    }

    /**
     * Adds new edges between nodes in the knowledge graph.
     */
    async addEdges(edges: Edge[]): Promise<Edge[]> {
        return this.edgeManager.addEdges(edges);
    }

    /**
     * Updates existing edges in the knowledge graph.
     */
    async updateEdges(edges: Edge[]): Promise<Edge[]> {
        return this.edgeManager.updateEdges(edges);
    }

    /**
     * Adds metadata to existing nodes.
     */
    async addMetadata(metadata: MetadataAddition[]): Promise<MetadataResult[]> {
        return this.metadataManager.addMetadata(metadata);
    }

    /**
     * Deletes nodes and their associated edges from the knowledge graph.
     */
    async deleteNodes(nodeNames: string[]): Promise<void> {
        await this.nodeManager.deleteNodes(nodeNames);
    }

    /**
     * Deletes metadata from nodes.
     */
    async deleteMetadata(deletions: MetadataDeletion[]): Promise<void> {
        await this.metadataManager.deleteMetadata(deletions);
    }

    /**
     * Deletes edges from the knowledge graph.
     */
    async deleteEdges(edges: Edge[]): Promise<void> {
        await this.edgeManager.deleteEdges(edges);
    }

    /**
     * Reads the entire knowledge graph.
     */
    async readGraph(): Promise<Graph> {
        return this.storage.loadGraph();
    }

    /**
     * Searches for nodes based on a query.
     */
    async searchNodes(query: string): Promise<OpenNodesResult> {
        return this.searchManager.searchNodes(query);
    }

    /**
     * Retrieves specific nodes by their names.
     */
    async openNodes(names: string[]): Promise<OpenNodesResult> {
        return this.searchManager.openNodes(names);
    }

    /**
     * Gets edges based on filter criteria.
     */
    async getEdges(filter?: EdgeFilter): Promise<GetEdgesResult> {
        const edges = await this.edgeManager.getEdges(filter);
        return {edges};
    }

    /**
     * Checks if currently in a transaction.
     */
    isInTransaction(): boolean {
        return this.transactionManager.isInTransaction();
    }

    /**
     * Gets the current state of the graph within a transaction.
     */
    getCurrentGraph(): Graph {
        return this.transactionManager.getCurrentGraph();
    }
}