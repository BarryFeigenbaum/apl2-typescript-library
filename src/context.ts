import { AsyncLocalStorage } from 'node:async_hooks';

export class APLContext {
    constructor(
        public indexOrigin: number = 0,
        public printWidth: number = 80,
        public printPrecision: number = 6,
        public comparisonTolerance: number = 1e-15
    ) {}

    clone(overrides: Partial<APLContext> = {}): APLContext {
        return new APLContext(
            overrides.indexOrigin ?? this.indexOrigin,
            overrides.printWidth ?? this.printWidth,
            overrides.printPrecision ?? this.printPrecision,
            overrides.comparisonTolerance ?? this.comparisonTolerance
        );
    }
}

export class APLRuntime {
    private static readonly stacks = new WeakMap<APLRuntime, APLContext[]>();
    private static readonly asyncStacks = new WeakMap<APLRuntime, AsyncLocalStorage<APLContext[]>>();
    private static readonly defaultRuntime = new APLRuntime();

    constructor(initialContext: APLContext = new APLContext()) {
        APLRuntime.stacks.set(this, [initialContext.clone()]);
        APLRuntime.asyncStacks.set(this, new AsyncLocalStorage<APLContext[]>());
    }

    createContext(overrides: Partial<APLContext> = {}): APLContext {
        return this.currentContext().clone(overrides);
    }

    currentContext(): APLContext {
        return this.getStack()[this.getStack().length - 1] as APLContext;
    }

    pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        if (this.getAsyncStorage().getStore() !== undefined) {
            throw new Error('Use APLRuntime.run() to scope async context changes');
        }

        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.currentContext().clone(contextOrOverrides);
        this.setStack([...this.getStack(), context]);
        return context;
    }

    popContext(): APLContext {
        if (this.getAsyncStorage().getStore() !== undefined) {
            throw new Error('Use APLRuntime.run() to scope async context changes');
        }

        const stack = this.getStack();
        const removed = stack[stack.length - 1] as APLContext;
        if (stack.length <= 1) {
            return removed;
        }
        this.setStack(stack.slice(0, -1));
        return removed;
    }

    private getStack(): APLContext[] {
        const asyncStack = this.getAsyncStorage().getStore();
        if (asyncStack !== undefined) {
            return asyncStack;
        }

        const stack = APLRuntime.stacks.get(this);
        if (stack === undefined) {
            const defaultStack = [new APLContext()];
            APLRuntime.stacks.set(this, defaultStack);
            return defaultStack;
        }
        return stack;
    }

    private setStack(stack: APLContext[]): void {
        if (this.getAsyncStorage().getStore() !== undefined) {
            this.getAsyncStorage().enterWith(stack);
            return;
        }

        APLRuntime.stacks.set(this, stack);
    }

    private getAsyncStorage(): AsyncLocalStorage<APLContext[]> {
        const storage = APLRuntime.asyncStacks.get(this);
        if (storage === undefined) {
            const nextStorage = new AsyncLocalStorage<APLContext[]>();
            APLRuntime.asyncStacks.set(this, nextStorage);
            return nextStorage;
        }
        return storage;
    }

    run<TResult>(
        contextOrOverrides: Partial<APLContext> | APLContext,
        callback: () => TResult
    ): TResult {
        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.currentContext().clone(contextOrOverrides);
        const stack = [...this.getStack(), context];
        return this.getAsyncStorage().run(stack, callback);
    }

    static createContext(overrides: Partial<APLContext> = {}): APLContext {
        return this.defaultRuntime.createContext(overrides);
    }

    static currentContext(): APLContext {
        return this.defaultRuntime.currentContext();
    }

    static pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        return this.defaultRuntime.pushContext(contextOrOverrides);
    }

    static popContext(): APLContext {
        return this.defaultRuntime.popContext();
    }

    static run<TResult>(
        contextOrOverrides: Partial<APLContext> | APLContext,
        callback: () => TResult
    ): TResult {
        return this.defaultRuntime.run(contextOrOverrides, callback);
    }

    static create(overrides: Partial<APLContext> = {}): APLContext {
        return this.createContext(overrides);
    }

    static current(): APLContext {
        return this.currentContext();
    }

    static push(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        return this.pushContext(contextOrOverrides);
    }

    static pop(): APLContext {
        return this.popContext();
    }
}

export function createContext(overrides: Partial<APLContext> = {}): APLContext {
    return APLRuntime.createContext(overrides);
}

export function currentContext(): APLContext {
    return APLRuntime.currentContext();
}

export function pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
    return APLRuntime.pushContext(contextOrOverrides);
}

export function popContext(): APLContext {
    return APLRuntime.popContext();
}
