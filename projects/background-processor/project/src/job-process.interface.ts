export abstract class JobProcess {
  public abstract start(): Promise<void>;
  public abstract stop(): Promise<void>;
}
