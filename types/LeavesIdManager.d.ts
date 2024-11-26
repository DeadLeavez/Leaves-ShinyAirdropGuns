import { HashUtil } from "@spt/utils/HashUtil";
import { LeavesUtils } from "./LeavesUtils";
export declare class LeavesIdManager {
    protected hashUtil: HashUtil;
    protected leavesUtils: LeavesUtils;
    private IDTranslator;
    private filepath;
    constructor(hashUtil: HashUtil, leavesUtils: LeavesUtils);
    load(filename: string): void;
    save(): void;
    get(name: string): string;
}
