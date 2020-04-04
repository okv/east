export interface Adapter<TClient> {
    /**
     * Returns the client that is passed as a parameter to `migrate()` and `rollback()`.
     */
    connect(): Promise<TClient>;

    /**
     * Releases the resources (if any) allocated by the adapter internally.
     */
    disconnect(): Promise<void>;

    /**
     * Returns an absolute path to the template that is used by `east create <migration-name>`
	 * If adapter supports multiple languages it should check for the extension
	 * name and return the path to the appropriate template for the given
	 * file extension, otherwise an error should be thrown.
	 *
	 * @param sourceMigrationExtension defines the file extension for the created
	 * migration without the leading dot (e.g. 'js', 'ts', etc.)
     */
    getTemplatePath(sourceMigrationExtension: string): string;

    /**
     * Returns the entire list of all executed migration names.
     */
    getExecutedMigrationNames(): Promise<string[]>;

    /**
     * Marks the migration under `migrationName` as executed in the backing migration state storage.
     */
    markExecuted(migrationName: string): Promise<void>;

    /**
     * Unmarks migration under `migrationName` as executed in the backing migration state storage.
     */
    unmarkExecuted(migrationName: string): Promise<void>;
}

export interface AdapterConstructor<TClient> {
    /**
     * Creates an instance of `Adapter` passing the parsed `.eastrc` config
     * file object.
     */
    new (params: unknown): Adapter<TClient>;
}
