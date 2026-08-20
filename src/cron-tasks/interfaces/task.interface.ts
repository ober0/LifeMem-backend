export interface ICronTask {
    execute(): Promise<void>;
}
