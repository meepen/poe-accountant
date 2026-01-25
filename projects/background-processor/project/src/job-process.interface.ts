export abstract class JobProcess {
  public abstract start(): Promise<void> | void;
  public abstract stop(): Promise<void> | void;
}
