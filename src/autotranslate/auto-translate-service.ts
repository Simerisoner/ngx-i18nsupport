import {Observable} from 'rxjs';
import {RxHR} from "@akanass/rx-http-request";
import {format} from 'util';
/**
 * Created by roobm on 03.07.2017.
 */

/**
 * Types form google translate api.
 */

interface GetSupportedLanguagesRequest {
    target: string; // The language to use to return localized, human readable names of supported\nlanguages.
}

interface LanguagesResource {
    language: string; // code of the language
    name: string; // human readable name (in target language)
}

interface LanguagesListResponse {
    languages: LanguagesResource[];
}

interface TranslateTextRequest {
    q: string[];  // The input texts to translate
    target: string; // The language to use for translation of the input text
    source: string; // The language of the source text
    format?: string; // "html" (default) or "text"
    model?: string; // see public documentation
}

interface TranslationsResource {
    detectedSourceLanguage?: string;
    model?: string;
    translatedText: string;
}

interface TranslationsListResponse {
    translations: TranslationsResource[];
}

export class AutoTranslateService {

    _rootUrl: string;
    _apiKey: string;

    constructor(apiKey: string) {
        this._apiKey = apiKey;
        this._rootUrl = 'https://translation.googleapis.com/';
    }

    /**
     * Translate an array of messages at once.
     * @param messages the messages to be translated
     * @param from source language code
     * @param to target language code
     * @return Observable with translated messages or error
     */
    public translateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
        if (!this._apiKey) {
            return Observable.throw('error, no api key');
        }
        const translateRequest: TranslateTextRequest = {
            q: messages,
            target: to,
            source: from,
        };
        const realUrl = this._rootUrl + 'language/translate/v2' + '?key=' + this._apiKey;
        const options = {
            url: realUrl,
            body: translateRequest,
            json: true,
//            proxy: 'http://127.0.0.1:8888' To set a proxy use env var HTTPS_PROXY
        };
        return RxHR.post(realUrl, options).map((data) => {
            console.log('Data ', data);
            const body: any = data.body;
            if (!body) {
                throw new Error('no result received');
            }
            if (body.error) {
                if (body.error.code === 400) {
                    throw new Error(format('Invalid request: %s', body.error.message));
                } else {
                    throw new Error(format('Error %s: %s', body.error.code, body.error.message));
                }
            }
            const result = body.response;
            return result.translations.map((translation: TranslationsResource) => {
                return translation.translatedText;
            });
        });
    }

}