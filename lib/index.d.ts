/**
 * Adapter determines where executed migration names will be stored and what will be
 * passed to `migrate` and `rollback` function as a parameter.
 */
export interface Adapter<P = unknown> {
    /**
     * Returns the client that is passed as a parameter to `migrate()` and `rollback()`.
     */
    connect(): Promise<P>;

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

export interface AdapterConstructorParams<P = unknown> extends MigratorParams<P> {
    /**
     * Adapter constructor is invoked only when the property `adapter` of `MigratorParams`
     * is a string that is the path leading to the adapter module itself.
     */
    adapter: string;

    /**
     * Any other additional parameters that are required by the adapter.
     * The adapter should check their presense and validity by himself.
     */
    [additionalParams: string]: unknown;
}

/**
 * Creates an instance of `Adapter` passing the config object (that will also
 * contain properties from `.eastrc` if not overriden in code).
 */
export type AdapterConstructor<P = unknown> = new (params: AdapterConstructorParams<P>) => Adapter<P>;

export interface MigratorParams<P = unknown> {
    /**
     * Path to migration executable scripts dir.
     *
     * Default: `"./migrations"`
     */
    dir: string;

    /**
     * Path to the adapter to require or the `AdpaterConstructor` itself.
     *
     * Default: path to the builtin adapter that stores executed migration names
     * at file `.migrations` in dir which is located at `dir` and passes `null`
     * to `migrate()/rollback()`
     */
    adapter: string | AdapterConstructor<P>;

    /**
     * File extension of migrations at `dir` (without the leading dot, e.g. `"js"`, `"ts"`)
     *
     * Default: `"js"`
     */
    migrationExtension: string;

    /**
     * Dir with migration source files (for transpiled languages e.g. ts)
     *
     * Default: the same as `dir`
     */
    sourceDir: string;

    /**
     * File extension of migrations at `sourceDir` (without the leading dot, e.g. `"js"`, `"ts"`)
     *
     * Default: the same as `migrationExtension`
     */
    sourceMigrationExtension: string;

    /**
     * Execution timeout in milliseconds.
     *
     * Default: one week (unreal)
     */
    timeout: number;

    /**
     * Database url. This is not used by `east` itself, it is just passed to the
     * adapter and only the adapter determines what to do with it. By convention,
     * adapters * should use `url` for passing the target database cluster domain
     * endpoint.
     *
     * Default: `null`
     */
    url: null | string;

    /**
     * Numbering format for migration file names.
     *
     * Default: `"sequentialNumber"`
     */
    migrationNumberFormat: MigrationNumberFormat;

    /**
     * Whether to turn on verbose mode (includes error stack trace).
     *
     * Default: `false`
     */
    trace: boolean;

    /**
     * Whether to load the `config` file. Its contents will be merged with
     * these parameters, though if some parameters passed here also appear
     * in `config` file, the former will take precedence.
     *
     * Default: `true`
     */
    loadConfig: boolean;

    /**
     * Path to the config file. This may be a `json` file or a `js` file that
     * exports the config object as `module.exports`.
     *
     * Default: `"./.eastrc"`
     */
    config: string;

    /**
     * Path to the template file for new migrations.
     *
     * Default: builtin `"js"` or `"ts"` template according to `sourceMigrationExtension`
     */
    template: string;

    /**
     * Array of paths to plugin modules or plugin objects themselves.
     * `module.exports` of the plugin module should conform to `Plugin` interface.
     *
     * Default: `undefined`
     */
    plugins?: (string | Plugin<P>)[];

    /**
     * Whether to load config, migrations, adapter and plugins using import
     * expression. It allows to provide those entities like commonjs or es
     * modules.
     *
     * Default: `false`
     */
    esModules: boolean;
}

export interface Plugin<P = unknown> {
    register(params: RegisterPluginParams<P>): Promise<void>;
}

export interface RegisterPluginParams<P = unknown> {
    migratorParams: MigratorParams<P>;
    migratorHooks: Hooks<P>;
}

export interface OkHookParams<P = unknown> {
    migrationName: string;
    /**
     * Parameter value that is passed to `migrate(param: P)/rollback(param: P)`
     */
    migrationParams: P;
}
export interface ErrHookParams<P = unknown> extends OkHookParams<P> {
    error: unknown;
}

type OkHook<P = unknown> = (params: OkHookParams<P>) => void;
type ErrHook<P = unknown> = (params: ErrHookParams<P>) => void;

export interface Hooks<P = unknown> {
    on(event: 'beforeMigrate', listener: OkHook<P>): this;
    on(event: 'afterMigrate', listener: OkHook<P>): this;
    on(event: 'migrateError', listener: ErrHook<P>): this;

    on(event: 'beforeRollback', listener: OkHook<P>): this;
    on(event: 'afterRollback', listener: OkHook<P>): this;
    on(event: 'rollbackError', listener: ErrHook<P>): this;
}

/**
 * The default format for migration file names is to prepend a number to the filename
 * which is incremented with every new file.
 * This creates migration files such as
 * - `migrations/1_doSomething.js`,
 * - `migrations/2_doSomethingElse.js`.
 *
 * If you prefer your files to be created with a date time instead of sequential numbers,
 * you can choose the `dateTime` format.
 * This will create migration files with date time prefix in `YYYYMMDDhhmmss` format such as
 * - `migrations/20190720172730_doSomething.js`
 */
export type MigrationNumberFormat = "sequentialNumber" | "dateTime";

/**
 * Parameters for the default builtin adapter that stores the migration state in
 * a file on the local filesystem.
 */
export interface FileStorageAdapterParams {
    /**
     * Path to the file where the migration state is stored.
     *
     * Default: `"${dir}/.migrations"`
     */
    migrationsFile?: string;
}

export interface CreateResult {
    /**
     * Name of the migration that was created. Doesn't include the file
     * extension. It has the following format: `<migrationNumber>_<basename>`
     */
    name: string;
}

export type MigrationFileType = "executable" | "source";

export type GetMigrationNamesParams = MigrationFilters & {
    /**
     * If true then result array will be reversed.
     *
     * Default: `false`
     */
    reverseOrderResult?: boolean;
};

type MigrationFilters =
    {
        /**
         * Tag expression to filter migrations e.g. 'tag1 & !tag2'
         *
         * Default: `undefined`
         */
        tag?: string;
    } & ({
        /**
         * Array of target migrations, each migration could be defined by basename,
         * full name, path or number
         */
        migrations: string[];
        status?: undefined;
    } | {
        /**
         * Status to filter migrations by.
         */
        status: MigrationStatusFilter;
        migrations?: undefined;
    });


export type MigrationStatusFilter = "new" | "executed" | "all";

export type MigrateParams = Partial<MigrationFilters> & {
    /**
     * Whether to allow executing/rollbacking already executed/rollbacked migrations.
     *
     * Default: `false`
     */
    force?: boolean;
};

export type RollbackParams = MigrateParams;

/**
 * `P` defines the type of the parameter that is passed to `migrate(param: P)/rollback(param: P)`
 * most of the time this will be the database api client instance.
 *
 * `U` defines the object type of configurations for the adapter.
 */
export class MigrationManager<P = unknown, U	 extends object = FileStorageAdapterParams> {
    /**
     * Configures migration process (dir, adapter, etc). Merges `params` with loaded config
     * (when `loadConfig` param is truthy - `true` by default).
     * This method should be called before any other methods.
     */
    configure(params: Partial<MigratorParams<P> & U>): Promise<void>;

    /**
     * Connects to database management system (if supposed by adapter).
     */
    connect(): Promise<void>;

    /**
     * Disconnects from database management system (if supposed by adapter).
     */
    disconnect(): Promise<void>;

    /**
     * Returns parameters used by migration process after configuration(`configure()` method).
     */
    getParams(): Promise<MigratorParams<P> & U>;

    /**
     * Initiates migration process for a project. Should be called once per project.
     */
    init(): Promise<void>;

    /**
     * Returns a boolean whether init was made or not.
     */
    isInitialized(): Promise<boolean>;

    /**
     * Creates migration file with the template as a placeholder.
     *
     * @param basename Name of migration to be used as a base of the file name.
     * It should not contain commas
     */
    create(basename: string): Promise<CreateResult>;

    /**
     * Returns an absolute path of the migration on disk by name of the migration.
     * Doesn't throw if the migration file doesn't exist, it only returns
     * the path where the migration file is **supposed** to be located.
     *
     * @param name Name of the migration
     * @param migrationFileType Type of the migration file to locate, `"executable"` by default
     */
    getMigrationPath(name: string, migrationFileType?: MigrationFileType): Promise<string>;

    /**
     * Returns migrations names, `migrations` and `status` are mutually exclusive.
     * If migrations `status` is not provided then all migrations will be processed
     * (but also filtered by `tag`).
     */
    getMigrationNames(params: GetMigrationNamesParams): Promise<string[]>;

    /**
     * Executes target migrations. By default migrations with `status` `"new"` are chosen.
     */
    migrate(params: MigrateParams): Promise<void>;

    /**
     * Rollbacks target migrations. By default migrations with `status` `"executed"` are chosen.
     */
    rollback(params: RollbackParams): Promise<void>;
}

interface MigrationManager extends MigrationManagerSubscriptionProvider {}
type MigrationManagerSubscriptionProvider = (
    & Subscribable<"beforeMigrateOne", MigrateOneEvent>
    & Subscribable<"afterMigrateOne", MigrateOneEvent>

    & Subscribable<"beforeRollbackOne", RollbackOneEvent>
    & Subscribable<"afterRollbackOne", RollbackOneEvent>

    & Subscribable<"beforeMigrateMany", MigrateManyEvent>
    & Subscribable<"afterMigrateMany", MigrateManyEvent>

    & Subscribable<"beforeRollbackMany", RollbackManyEvent>
    & Subscribable<"afterRollbackMany", RollbackManyEvent>

    & Subscribable<"onSkipMigration", SkipMigrationEvent>
);


interface Subscribable<E, P> {
    addListener(event: E, listener: (param: P) => void): this;
    on(event: E, listener: (param: P) => void): this;
    once(event:E, listener: (param: P) => void): this;
    prependListener(event: E, listener: (param: P) => void): this;
    prependOnceListener(event: E, listener: (param: P) => void): this;
}

export interface SkipMigrationEvent {
    migration: {
        name: string;
    };
    reason: SkipMigrationReason;
}
export type SkipMigrationReason =
    | "cannotMigrateAlreadyExecuted"
    | "cannotRollbackNotExecuted"
    | "cannotRollbackWithoutRollback";

export type RollbackManyEvent = MigrateManyEvent;
export interface MigrateManyEvent {
    migrationNames: string[];
}

export type RollbackOneEvent = MigrateOneEvent;
export interface MigrateOneEvent {
    name: string;
    tags?: string[];
}
