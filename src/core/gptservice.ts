import OpenAI from "openai";
import { ImageGenerateParams } from "openai/resources";
import { SpeechCreateParams } from "openai/resources/audio/speech";

export interface IGPTUrlResult {
    urls: string[];
}

export interface IGPTService {
    createImage(config: ImageGenerateParams): Promise<IGPTResponse<IGPTUrlResult>>;
    singleConverse(primer: string, prompt: string): Promise<IGPTResponse<string>>;
    singleTextToSpeeh(config: SpeechCreateParams): Promise<IGPTResponse<Buffer>>;
}

export interface IGPTResponse<T> {
    startTime: number;
    endTime?: number;
    success: boolean;
    hasErrors: boolean;
    errors?: IGPTResponseError[];
    result?: T;
    action: string;
}

export interface IGPTResponseError {
    type: "ERROR" | "WARNING";
    message?: string;
    errCode: string;
}

const ERROR_CODES = {
    EMPTY:'EMPTY',
    EXCEPTION:'EXCEPTION'
}

export class GPTService implements IGPTService {

    public static readonly API_URL: string = "https://api.openai.com/v1";
    private _apiKey: string;
    private _client: OpenAI;

    public constructor() {
        if (!process.env.OPENAI_API_KEY)
            throw new Error("OPENAI_API_KEY not found");
        this._apiKey = process.env.OPENAI_API_KEY as string;
        this._client = new OpenAI({
            apiKey: this._apiKey
        });
    }

    async createImage(config: ImageGenerateParams): Promise<IGPTResponse<IGPTUrlResult>> {
        const resp = GPTService.initResp<IGPTUrlResult>(this.createImage.name);
        try {
            const openaiResp = await this._client.images.generate(config);
            resp.result = {
                urls: openaiResp.data.map(x => x.url)
            } as IGPTUrlResult;
        }
        catch (err) {
            GPTService.errResp(err, resp);
        }
        return GPTService.retResp(resp);
    }

    async singleConverse(primer:string, prompt: string): Promise<IGPTResponse<string>> {
        const resp = GPTService.initResp<string>(this.singleConverse.name);
        try {
            const openaiResp = await this._client.chat.completions.create(
                {
                    messages: [{role: "system", content: primer}, {role: "user", content: prompt}],
                    model:'gpt-3.5-turbo',
                }
            );
            resp.result = openaiResp.choices[0].message.content || undefined;
            if(!(resp.result?.length)) {
                resp.errors?.push({type:'ERROR',errCode:ERROR_CODES.EMPTY});
            }
        }
        catch (err) {
            GPTService.errResp(err, resp);
        }
        return GPTService.retResp(resp);
    }

    async singleTextToSpeeh(config: SpeechCreateParams): Promise<IGPTResponse<Buffer>> {
        const resp = GPTService.initResp<Buffer>(this.createImage.name);
        
        try {
            const openaiResp = await this._client.audio.speech.create(config);
            resp.result = Buffer.from(await openaiResp.arrayBuffer());
        }
        catch (err) {
            GPTService.errResp(err, resp);
        }
        return GPTService.retResp(resp);
    }

    private static initResp<T>(action: string): IGPTResponse<T> {
        const response: IGPTResponse<T> = {
            startTime: Date.now(), success: true, hasErrors: false, action
        };
        return response;
    }

    private static retResp(resp: IGPTResponse<any>): IGPTResponse<any> {
        resp.endTime = Date.now();
        resp.hasErrors = resp.errors?.find(x => x.type === "ERROR") != null;
        console.log(`${resp.action}:`, JSON.stringify(resp));
        return resp;
    }

    private static errResp(err: any, resp: IGPTResponse<any>) {
        console.error(err);
        let message = `Unkown error at ${resp.action}`;
        if (err instanceof Error) message = err.message;
        else if (typeof err === "string") message = err;
        resp.success = false;
        resp.errors = [
            { type: "ERROR", message, errCode:ERROR_CODES.EXCEPTION }
        ];
    }
}