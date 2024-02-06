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
    cost:number;
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

const PRICING  = {
    'gpt-3.5-turbo': {
        'prompt_1k': 0.0030,
        'completion_1k': 0.0060,
    },
    'dall-e-3':{
        'image_1': 0.040
    },
    'tts-1': {
        'speech_1k': 0.015
    }
}
export class GPTService implements IGPTService {
    private static DEFAULT_COMPLETION_MODEL = 'gpt-3.5-turbo';

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
            const pricing = GPTService.getPricing(config.model!);
            const openaiResp = await this._client.images.generate(config);
            resp.result = {
                urls: openaiResp.data.map(x => x.url)
            } as IGPTUrlResult;
            resp.cost = pricing.image_1;
        }
        catch (err) {
            GPTService.errResp(err, resp);
        }
        return GPTService.retResp(resp);
    }

    async singleConverse(primer:string, prompt: string): Promise<IGPTResponse<string>> {
        const resp = GPTService.initResp<string>(this.singleConverse.name);
        try {
            const pricing = GPTService.getPricing(GPTService.DEFAULT_COMPLETION_MODEL);
            const config:any = {
                messages: [{role: "system", content: primer}, {role: "user", content: prompt}],
                model:GPTService.DEFAULT_COMPLETION_MODEL,
            };
            const openaiResp = await this._client.chat.completions.create(config);
            resp.result = openaiResp.choices[0].message.content || undefined;
            resp.cost = ((openaiResp.usage?.completion_tokens ?? 0)*pricing.completion_1k)/1000
                        +  ((openaiResp.usage?.prompt_tokens ?? 0)*pricing.prompt_1k)/1000;
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
            const pricing = GPTService.getPricing(config.model);
            const openaiResp = await this._client.audio.speech.create(config);
            resp.result = Buffer.from(await openaiResp.arrayBuffer());
            resp.cost = (pricing.speech_1k * (config.input.length ?? 0))/1000;
        }
        catch (err) {
            GPTService.errResp(err, resp);
        }
        return GPTService.retResp(resp);
    }

    private static getPricing(model:string):any {
        const pricing = (PRICING as any)[model];
        if(!pricing) throw new Error(`Missing pricing.`);
        return pricing;
    }

    private static initResp<T>(action: string): IGPTResponse<T> {
        const response: IGPTResponse<T> = {
            startTime: Date.now(), success: true, hasErrors: false, action, cost: 0
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